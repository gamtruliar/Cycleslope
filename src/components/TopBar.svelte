<header class="topbar">
  <div class="container topbar__content">
    <div class="topbar__brand">
      <span class="brand-icon">🚴‍♀️</span>
      <div>
        <p class="brand-title">香港單車爬坡</p>
        <p class="brand-subtitle">介面原型</p>
      </div>
    </div>
    <nav class="topbar__nav">
      <a href="#filters">篩選</a>
      <a href="#profile">你的設定</a>
      <a href="#slopes">爬坡列表</a>
      <a href="#map">地圖</a>
    </nav>
    <button class="cta">訂閱更新</button>
  </div>
</header>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(14px);
  }

  .topbar__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 0;
  }

  .topbar__brand {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-icon {
    font-size: 1.75rem;
  }

  .brand-title {
    margin: 0;
    font-weight: 700;
    font-size: 1.1rem;
    letter-spacing: -0.01em;
  }

  .brand-subtitle {
    margin: 0;
    color: #64748b;
    font-size: 0.8rem;
  }

  .topbar__nav {
    display: flex;
    gap: 1.5rem;
    font-size: 0.95rem;
  }

  .topbar__nav a {
    color: #334155;
    text-decoration: none;
    font-weight: 500;
  }

  .cta {
    border: none;
    background: linear-gradient(135deg, #2563eb, #0ea5e9);
    color: white;
    padding: 0.55rem 1.3rem;
    border-radius: 999px;
    font-weight: 600;
    box-shadow: 0 10px 20px rgba(37, 99, 235, 0.25);
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .topbar__content {
      flex-wrap: wrap;
      gap: 1rem;
    }

    .topbar__nav {
      order: 3;
      width: 100%;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  }
</style>
