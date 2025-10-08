export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  console.log("[API Request] Starting request:", { method, url, hasData: !!data });
  
  const isFormData = data instanceof FormData;
  
  const headers: HeadersInit = data && !isFormData ? { 
    "Content-Type": "application/json" 
  } : {};

  console.log("[API Request] Headers:", headers);
  console.log("[API Request] Body:", isFormData ? "FormData" : (data ? JSON.stringify(data).substring(0, 200) : "none"));

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      credentials: "include",
    });

    console.log("[API Request] Response received:", { status: res.status, ok: res.ok });

    if (!res.ok) {
      const error = await res.text();
      console.error("[API Request] Error response:", error);
      throw new Error(error || res.statusText);
    }

    return res;
  } catch (error) {
    console.error("[API Request] Fetch failed:", error);
    throw error;
  }
}