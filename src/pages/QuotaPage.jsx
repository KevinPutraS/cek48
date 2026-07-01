import TopBar from "../components/TopBar";
import {
  QuotaControls,
  QuotaDataPanel,
  QuotaSummary,
} from "../features/quota/QuotaPageSections";
import useQuotaMonitor from "../features/quota/useQuotaMonitor";

export default function QuotaPage() {
  const monitor = useQuotaMonitor();

  return (
    <div className="app-shell">
      <TopBar
        connectionStatus={monitor.connectionStatus}
        lastUpdated={monitor.lastUpdated}
        isRefreshing={monitor.isRefreshing}
        onRefresh={monitor.handleRefresh}
        sectionLabel="Monitor Kuota"
        sectionDescription="Pantau kuota member secara real-time"
      />

      <main id="main-content" className="main-container">
        <section className="monitor-frame">
          <QuotaControls monitor={monitor} />
          <QuotaSummary monitor={monitor} />
          <QuotaDataPanel monitor={monitor} />
        </section>

        <footer className="site-footer">
          <span>CEK48 SYSTEM // BUILD 5.4.0</span>
          <span className="build-credit">
            <span className="build-status-dot" />
            Built &amp; Engineered by <strong>Kevin Putra Sulisto</strong>
          </span>
        </footer>
      </main>
    </div>
  );
}
