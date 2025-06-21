// hooks/useSubPage.js

export function useSubPage() {
  /**
   * 打开子页面（伪跳转）
   * @param {string} path - 目标路径，如 /detail/123
   * @param {object} [query={}] - 可选的 query 参数对象
   */
  function openSubPage(path, query = {}) {
    const url = new URL(location.origin + path)
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v)
    }
    window.history.pushState({ __from_subpage__: true }, '', url.pathname + url.search)
    window.dispatchEvent(new Event('popstate')) // 通知路由或组件状态同步
  }

  /**
   * 关闭子页面（返回上一页）
   */
  function closeSubPage() {
    window.history.back()
  }

  return {
    openSubPage,
    closeSubPage,
  }
}
