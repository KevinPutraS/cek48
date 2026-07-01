import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("CEK48 render error:", error, info);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-crash-screen" role="alert">
        <img src="/cek48-icon.png" alt="" width="549" height="534" />
        <span>CEK48 SYSTEM</span>
        <h1>Tampilan gagal dimuat.</h1>
        <p>Data kamu aman. Muat ulang aplikasi untuk mencoba memulihkan halaman.</p>
        <button type="button" onClick={this.handleReload}>
          Muat ulang
        </button>
      </main>
    );
  }
}
