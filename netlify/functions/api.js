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
    const headers = {
      'Content-Type': event.headers['content-type'] || 'application/json'
    }

    if (event.headers.authorization) {
      headers['Authorization'] = event.headers.authorization
    }

    const fetchOptions = {
      method: event.httpMethod,
      headers: headers
    }

    if (event.body) {
      fetchOptions.body = event.body
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
