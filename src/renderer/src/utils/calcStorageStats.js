import BigNumber from 'bignumber.js'

/**
 * 格式化存储大小（支持从字节自动转换为 KB / MB / GB，截断，不四舍五入）
 * @param {BigNumber} bytes 单位：字节
 * @returns {string} 返回带单位的字符串，例如 "1.23 GB"
 */
function formatStorage(bytes) {
  const KB = new BigNumber(1000)
  const MB = KB.multipliedBy(1000)
  const GB = MB.multipliedBy(1000)

  if (bytes.isGreaterThanOrEqualTo(GB)) {
    return trimDecimalZeros(bytes.dividedBy(GB).toFixed(2, BigNumber.ROUND_DOWN)) + ' GB'
  } else if (bytes.isGreaterThanOrEqualTo(MB)) {
    return trimDecimalZeros(bytes.dividedBy(MB).toFixed(2, BigNumber.ROUND_DOWN)) + ' MB'
  } else if (bytes.isGreaterThanOrEqualTo(KB)) {
    return trimDecimalZeros(bytes.dividedBy(KB).toFixed(2, BigNumber.ROUND_DOWN)) + ' KB'
  } else {
    return bytes.toFixed(0) + ' B'
  }
}

/**
 * 去除小数点后无效的 0（例如 "23.00" ➝ "23", "23.10" ➝ "23.1"）
 */
function trimDecimalZeros(numStr) {
  return numStr.replace(/\.?0+$/, '')
}

/**
 * 精确计算存储空间信息，单位字节，自动换算单位
 * @param {string | number} total 总空间（单位：Byte）
 * @param {string | number} used  已使用空间（单位：Byte）
 */
export const calcStorageStats = (total, used) => {
  const totalBN = new BigNumber(total || 0)
  const usedBN = new BigNumber(used || 0)
  const remainBN = BigNumber.maximum(totalBN.minus(usedBN), 0)

  const percentBN = totalBN.isZero()
    ? new BigNumber(0)
    : usedBN.dividedBy(totalBN).multipliedBy(100)

  const percent = trimDecimalZeros(
    percentBN.toFixed(2, BigNumber.ROUND_DOWN)
  )

  return {
    total: totalBN.toFixed(0),  // 原始 Byte
    used: usedBN.toFixed(0),
    remain: remainBN.toFixed(0),
    percent,
    totalDisplay: formatStorage(totalBN),
    usedDisplay: formatStorage(usedBN),
    remainDisplay: formatStorage(remainBN),
  }
}
