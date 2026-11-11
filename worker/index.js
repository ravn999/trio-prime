export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Proxy to the Pages deployment
    const targetUrl = `https://c640d55e.trio-crm-staging.pages.dev${url.pathname}${url.search}`;
    
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    });
    
    return response;
  }
};
