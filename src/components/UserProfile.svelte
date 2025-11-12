<section id="profile" class="profile glass">
  <header>
    <p class="eyebrow">你的設定</p>
    <h2>設定你目前的單車與輸出。</h2>
  </header>
  <div class="profile__grid">
    <div class="profile__card">
      <h3>車款與傳動</h3>
      <ul>
        <li>
          <span class="label">車款</span>
          <span class="value">耐力公路</span>
        </li>
        <li>
          <span class="label">前齒盤</span>
          <span class="value">50 / 34</span>
        </li>
        <li>
          <span class="label">飛輪</span>
          <span class="value">11 - 34</span>
        </li>
        <li>
          <span class="label">外胎</span>
          <span class="value">28c 無內胎</span>
        </li>
      </ul>
    </div>
    <div class="profile__card">
      <h3>功率概況</h3>
      <ul>
        <li>
          <span class="label">FTP</span>
          <span class="value">240 W</span>
        </li>
        <li>
          <span class="label">體重</span>
          <span class="value">68 kg</span>
        </li>
        <li>
          <span class="label">W/kg</span>
          <span class="value">3.5</span>
        </li>
        <li>
          <span class="label">爬坡風格</span>
          <span class="value">坐姿柴油型</span>
        </li>
      </ul>
    </div>
    <div class="profile__callout">
      <h3>下一步？</h3>
      <p>
        此卡片稍後會演化為可同步 <code>localStorage</code> 的互動表單。暫時先示範最終體驗預計的版面與層次。
      </p>
      <button>規劃變速檢查</button>
    </div>
  </div>
</section>

<style>
  .profile {
    margin: 3rem auto;
    padding: 2.5rem;
    border-radius: 20px;
  }

  header {
    margin-bottom: 2rem;
  }

  .eyebrow {
    margin: 0;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  h2 {
    margin: 0.6rem 0 0;
    font-size: 1.65rem;
  }

  .profile__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
  }

  .profile__card {
    padding: 1.75rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 16px 28px rgba(15, 23, 42, 0.12);
  }

  h3 {
    margin: 0 0 1rem;
    font-size: 1.1rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.75rem;
  }

  li {
    display: flex;
    justify-content: space-between;
    color: #1e293b;
  }

  .label {
    color: #64748b;
  }

  .value {
    font-weight: 600;
  }

  .profile__callout {
    padding: 2rem;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(14, 165, 233, 0.18));
    box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.2);
    display: grid;
    gap: 1rem;
  }

  button {
    border: none;
    align-self: start;
    padding: 0.6rem 1.4rem;
    border-radius: 999px;
    background: #2563eb;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }

  code {
    background: rgba(15, 23, 42, 0.08);
    padding: 0.15rem 0.4rem;
    border-radius: 6px;
  }
</style>
