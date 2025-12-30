import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function App() {
  const [response, setResponse] = useState<string>('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const checkHealth = async () => {
    setStatus('loading')
    setResponse('')
    
    try {
      const res = await fetch(`${API_URL}/health`)
      const data = await res.text()
      setResponse(`Status: ${res.status}\nResponse: ${data}`)
      setStatus('success')
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setStatus('error')
    }
  }

  return (
    <div className="container">
      <h1>家計簿アプリ - CORS テスト</h1>
      
      <div className="info">
        <p><strong>API URL:</strong> {API_URL}</p>
        <p><strong>Endpoint:</strong> {API_URL}/health</p>
      </div>

      <button onClick={checkHealth} disabled={status === 'loading'}>
        {status === 'loading' ? 'Loading...' : 'Health Check'}
      </button>

      {response && (
        <div className={`response ${status}`}>
          <pre>{response}</pre>
        </div>
      )}

      <div className="instructions">
        <h2>確認手順</h2>
        <ol>
          <li>ボタンを押してAPIを叩く</li>
          <li>成功すれば緑色で表示される</li>
          <li>CORSエラーの場合は赤色でエラーが出る</li>
          <li>F12でDevToolsを開いてConsoleも確認</li>
        </ol>
      </div>
    </div>
  )
}

export default App
