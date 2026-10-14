/**
 * Safe API Client Utility
 * Prevents "Unexpected token ..., is not valid JSON" errors by safely checking
 * response status, headers, and body content before parsing.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isHtml?: boolean;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers || {})
      }
    });

    const contentType = res.headers.get('content-type') || '';
    const isJsonHeader = contentType.toLowerCase().includes('application/json');

    // Read response text first to inspect before parsing
    const rawText = await res.text();
    const trimmed = (rawText || '').trim();

    // Check if the response is empty
    if (!trimmed) {
      if (res.ok) {
        return { ok: true, status: res.status, data: null };
      }
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `استجاب الخادم برمز الحالة ${res.status}`
      };
    }

    // Check if the server returned HTML or a gateway error page
    const isHtmlContent =
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<!doctype') ||
      trimmed.startsWith('<html') ||
      trimmed.toLowerCase().includes('<body') ||
      trimmed.startsWith('The page c') ||
      trimmed.toLowerCase().startsWith('the page');

    if (isHtmlContent || (!isJsonHeader && trimmed.startsWith('<'))) {
      let friendlyError = '';
      if (res.status === 404) {
        friendlyError = 'نقطة النهاية المطلوبة غير متوفرة على الخادم (404 Not Found)';
      } else if (res.status === 401) {
        friendlyError = 'غير مصرح لك بالوصول (401 Unauthorized)';
      } else if (res.status === 403) {
        friendlyError = 'تم رفض الوصول (403 Forbidden)';
      } else if (res.status >= 500) {
        friendlyError = `حدث خطأ في خادم التطبيق (${res.status} Server Error)`;
      } else {
        friendlyError = `استجاب الخادم بصفحة ويب بدلاً من بيانات JSON (رمز ${res.status})`;
      }

      return {
        ok: false,
        status: res.status,
        data: null,
        error: friendlyError,
        isHtml: true
      };
    }

    // Attempt to parse JSON safely
    try {
      const parsed = JSON.parse(trimmed);
      if (!res.ok) {
        const errorMsg =
          parsed?.error ||
          parsed?.message ||
          `فشل الطلب برمز الحالة ${res.status}`;
        return {
          ok: false,
          status: res.status,
          data: parsed,
          error: errorMsg
        };
      }
      return {
        ok: true,
        status: res.status,
        data: parsed
      };
    } catch {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `تعذر قراءة بيانات الاستجابة من الخادم (رمز ${res.status})`
      };
    }
  } catch (err: any) {
    const isNetworkErr = err?.name === 'TypeError' || err?.message?.includes('fetch');
    return {
      ok: false,
      status: 0,
      data: null,
      error: isNetworkErr
        ? 'تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت'
        : err?.message || 'خطأ غير متوقع أثناء إرسال الطلب'
    };
  }
}
