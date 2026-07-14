import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-gunmetal-950 text-gunmetal-200 p-8 gap-6">
          <p className="font-display text-red-400 text-xl tracking-widest">SYSTEM FAILURE</p>
          <pre className="text-xs text-gunmetal-400 bg-gunmetal-900 p-4 rounded border border-red-900 max-w-2xl overflow-auto">
            {this.state.error.toString()}
          </pre>
          <button
            className="px-6 py-2 border border-bronze-300 text-bronze-300 font-display text-sm tracking-widest hover:bg-bronze-300/10 transition-colors"
            onClick={() => this.setState({ error: null })}
          >
            REBOOT UI
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
