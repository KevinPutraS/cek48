import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";

const MODULES = [
  {
    id: "quota",
    eyebrow: "LIVE QUOTA",
    title: "Monitor",
    description:
      "Pantau event eksklusif, sesi, member, dan perubahan kuota dalam satu alur yang mudah dibaca.",
    to: "/quota",
    accent: "pink",
    features: ["Event & sesi", "Status kuota"],
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />
      </svg>
    ),
  },
  {
    id: "members",
    eyebrow: "DIRECTORY",
    title: "Member",
    description:
      "Temukan member lebih cepat, saring berdasarkan tim, lalu simpan yang paling sering kamu cari.",
    to: "/members",
    accent: "violet",
    features: ["Cari & filter", "Member favorit"],
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="4" />
        <path d="M2.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6M17 7a3 3 0 0 1 0 6M17.5 15c2.2.5 3.5 2.2 4 5" />
      </svg>
    ),
  },
  {
    id: "schedule",
    eyebrow: "AGENDA",
    title: "Jadwal",
    description:
      "Lihat show, event, lineup, dan detail theater sebagai timeline bulanan yang ringkas.",
    to: "/schedule",
    accent: "cyan",
    features: ["Show & event", "Detail theater"],
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3v3M17 3v3M4 9h16" />
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M8 13h3M13 13h3M8 17h3" />
      </svg>
    ),
  },
];

const PRINCIPLES = [
  {
    title: "Data publik",
    text: "CEK48 membaca layanan publik JKT48 dan tidak mengubah informasi sumber.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3.5 12h17M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21M12 3C9.7 5.5 8.5 8.5 8.5 12S9.7 18.5 12 21" />
      </svg>
    ),
  },
  {
    title: "Tanpa login akun",
    text: "CEK48 tidak meminta username, password, atau akses ke akun JKT48 milikmu.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 4.5 6.5v5c0 4.6 3 7.5 7.5 9.5 4.5-2 7.5-4.9 7.5-9.5v-5z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    ),
  },
  {
    title: "Konfirmasi resmi",
    text: "Kuota, jadwal, harga, dan detail pembelian tetap perlu dicek di kanal resmi JKT48.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 17h.01" />
      </svg>
    ),
  },
];

const DATA_FLOW = [
  {
    step: "01",
    title: "Sumber publik",
    text: "Data tersedia dari layanan resmi JKT48.",
  },
  {
    step: "02",
    title: "Diringkas CEK48",
    text: "Informasi disusun ulang agar cepat dipahami.",
  },
  {
    step: "03",
    title: "Tampil di perangkatmu",
    text: "Kamu melihat hasilnya tanpa perlu login.",
  },
];

const HEALTH_META = {
  checking: {
    label: "Checking",
    detail: "Memeriksa layanan CEK48",
  },
  online: {
    label: "Operational",
    detail: "Layanan inti merespons normal",
  },
  degraded: {
    label: "Limited",
    detail: "Sebagian layanan belum terjangkau",
  },
};

export default function InfoPage() {
  const [systemHealth, setSystemHealth] = useState({ state: "checking" });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/health", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || payload?.ok === false) {
          throw new Error("Health check gagal");
        }

        setSystemHealth({ state: "online" });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;

        setSystemHealth({ state: "degraded" });
      });

    return () => controller.abort();
  }, []);

  const health = HEALTH_META[systemHealth.state] || HEALTH_META.checking;

  return (
    <div className="app-shell">
      <TopBar
        sectionLabel="INFO"
        sectionDescription="Tentang CEK48"
        showControls={false}
      />

      <main id="main-content" className="nx-page info-page">
        <section className="info-hero">
          <div className="info-hero__copy">
            <div className="info-version-chip">
              <span aria-hidden="true" />
              CEK48 5.4.0 · MAINTAINABILITY
            </div>

            <h1>
              Informasi JKT48,
              <span> tanpa terasa ramai.</span>
            </h1>

            <p>
              CEK48 menyatukan monitor kuota, direktori member, dan jadwal dalam
              pengalaman yang lebih cepat, jelas, dan nyaman dipakai dari layar kecil.
            </p>

            <div className="info-hero__actions">
              <Link to="/quota" className="info-button info-button--primary">
                Buka Monitor
                <span aria-hidden="true">→</span>
              </Link>

              <a
                href="https://jkt48.com"
                target="_blank"
                rel="noreferrer"
                className="info-button info-button--secondary"
              >
                Website resmi
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            <div className="info-hero__facts" role="list" aria-label="Ringkasan CEK48">
              <span role="listitem">Mobile first</span>
              <span role="listitem">Tanpa login</span>
              <span role="listitem">Independent project</span>
            </div>
          </div>

          <aside
            className={`info-status-card is-${systemHealth.state}`}
            aria-label="Status sistem CEK48"
          >
            <div className="info-status-card__top">
              <div>
                <span>SYSTEM STATUS</span>
                <strong>{health.label}</strong>
              </div>

              <div className="info-status-orbit" aria-hidden="true">
                <span>48</span>
                <i />
              </div>
            </div>

            <p>{health.detail}</p>

            <div className="info-status-list">
              <div>
                <span>Core API</span>
                <strong>
                  <i aria-hidden="true" />
                  {systemHealth.state === "online"
                    ? "Online"
                    : systemHealth.state === "degraded"
                      ? "Limited"
                      : "Checking"}
                </strong>
              </div>

              <div>
                <span>Build</span>
                <strong>5.4.0</strong>
              </div>
            </div>

            <small>
              Status ini memeriksa layanan CEK48, bukan kondisi seluruh layanan JKT48.
            </small>
          </aside>

          <div className="info-hero__glow" aria-hidden="true" />
          <div className="info-hero__grid" aria-hidden="true" />
        </section>

        <section className="info-section" aria-labelledby="info-modules-title">
          <header className="info-section__head">
            <div>
              <span>EXPLORE CEK48</span>
              <h2 id="info-modules-title">Langsung ke yang kamu butuhkan.</h2>
            </div>
            <p>Tiga halaman utama, satu bahasa visual yang konsisten.</p>
          </header>

          <div className="info-module-grid">
            {MODULES.map((module, index) => (
              <Link
                to={module.to}
                className={`info-module-card info-module-card--${module.accent}`}
                key={module.id}
              >
                <div className="info-module-card__top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <i>{module.icon}</i>
                </div>

                <div className="info-module-card__copy">
                  <small>{module.eyebrow}</small>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </div>

                <div className="info-module-card__bottom">
                  <div>
                    {module.features.map((feature) => (
                      <span key={feature}>{feature}</span>
                    ))}
                  </div>
                  <strong aria-hidden="true">→</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="info-explain-grid">
          <article className="info-flow-card">
            <header>
              <span>HOW IT WORKS</span>
              <h2>Data yang panjang, dibuat jadi tiga langkah.</h2>
              <p>
                CEK48 membantu membaca informasi. Keputusan akhir tetap mengikuti sumber
                resmi.
              </p>
            </header>

            <div className="info-flow-list">
              {DATA_FLOW.map((item) => (
                <div className="info-flow-item" key={item.step}>
                  <span>{item.step}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="info-principles-card">
            <header>
              <span>BUILT WITH CLARITY</span>
              <h2>Hal penting yang perlu kamu tahu.</h2>
            </header>

            <div className="info-principle-list">
              {PRINCIPLES.map((item) => (
                <div className="info-principle-item" key={item.title}>
                  <i>{item.icon}</i>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="https://jkt48.com"
              target="_blank"
              rel="noreferrer"
              className="info-official-link"
            >
              Buka sumber resmi JKT48
              <span aria-hidden="true">↗</span>
            </a>
          </article>
        </section>

        <section className="info-maker-card">
          <div className="info-maker-card__photo">
            <img
              src="/profile-kevin.jpg"
              alt="Kevin Putra Sulisto"
              loading="lazy"
              decoding="async"
              width="1600"
              height="1600"
            />
          </div>

          <div className="info-maker-card__copy">
            <span>BUILT & DESIGNED BY</span>
            <h2>Kevin Putra Sulisto</h2>
            <p>
              CEK48 dibangun sebagai ruang informasi JKT48 yang lebih ringkas, modern,
              dan nyaman digunakan setiap hari.
            </p>

            <div className="info-maker-card__stack" role="list" aria-label="Teknologi">
              <span role="listitem">React</span>
              <span role="listitem">Vite</span>
              <span role="listitem">JKT48 API</span>
              <span role="listitem">Vercel</span>
            </div>
          </div>

          <a
            href="https://instagram.com/kevnputras"
            target="_blank"
            rel="noreferrer"
            className="info-maker-card__social"
          >
            @kevnputras
            <span aria-hidden="true">↗</span>
          </a>
        </section>

        <footer className="info-footer">
          <div>
            <strong>
              CEK<span>48</span>
            </strong>
            <p>Independent JKT48 information experience.</p>
          </div>

          <p>
            CEK48 bukan aplikasi resmi JKT48. Selalu konfirmasi informasi sensitif waktu
            melalui kanal resmi.
          </p>
        </footer>
      </main>
    </div>
  );
}
