export const setToken = (token: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', token)
    }
}

export const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token')
    }
    return null
}

export const removeToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
    }
}

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getToken()
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    }

    const response = await fetch(url, { ...options, headers })

    if (response.status === 401) {
        removeToken()
        window.location.href = '/admin/login'
        throw new Error('Unauthorized')
    }

    return response
}
