const API_BASE_URL = 'http://47.84.135.181:8888'

exports.handler = async (event, context) => {
  const path = event.path.replace('/.netlify/functions/api', '')

  // 构建完整的 URL,包括查询参数
  let apiUrl = `${API_BASE_URL}${path}`
  if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
    const queryString = new URLSearchParams(event.queryStringParameters).toString()
    apiUrl += `?${queryString}`
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    }
  }

  try {
    const headers = {}

    // 复制 Content-Type (对于 multipart/form-data 很重要,包含 boundary)
    if (event.headers['content-type']) {
      headers['Content-Type'] = event.headers['content-type']
    }

    // 复制 Authorization
    if (event.headers.authorization) {
      headers['Authorization'] = event.headers.authorization
    }

    const fetchOptions = {
      method: event.httpMethod,
      headers: headers
    }

    // 处理请求体
    if (event.body) {
      // 如果是 base64 编码的二进制数据 (如文件上传)
      if (event.isBase64Encoded) {
        // 将 base64 字符串转换为 Buffer
        fetchOptions.body = Buffer.from(event.body, 'base64')
      } else {
        // 普通文本数据
        fetchOptions.body = event.body
      }
    }

    const response = await fetch(apiUrl, fetchOptions)
    const data = await response.text()

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: data
    }
  } catch (error) {
    console.error('API Proxy Error:', error)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        code: 500,
        msg: '代理服务器错误',
        error: error.message
      })
    }
  }
}
