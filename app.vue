<template>
  <div class="app">
    <SideBar />

    <main class="app__content">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup></script>

<style>
:root {
  --sidebar-width: 250px;
  --sidebar-collapsed-width: 60px;
  --header-height: 60px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

.app {
  display: flex;
}

.app__content {
  flex: 1;
  min-height: 100vh;
  margin-left: var(--sidebar-width);
  transition: margin-left 0.3s ease;
  background-color: #f5f5f5;
}

/* 사이드바 접힘 상태일 때 */
.sidebar--collapsed + .app__content {
  margin-left: var(--sidebar-collapsed-width);
}

@media (max-width: 768px) {
  .app {
    flex-direction: column;
  }

  .app__content {
    margin-left: 0;
    margin-top: var(--header-height);
    min-height: calc(100vh - var(--header-height));
  }

  .sidebar--collapsed + .app__content,
  .sidebar--mobile + .app__content,
  .sidebar--mobile-open + .app__content {
    margin-left: 0;
  }
}
</style>

