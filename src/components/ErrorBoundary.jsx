import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#e8eef6', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: 18 }}>MQTT Studio hit an error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#fca5a5', fontSize: 12 }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
