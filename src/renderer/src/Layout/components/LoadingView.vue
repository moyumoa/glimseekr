<template>
  <div class="loading-view">
    <div class="spinner"></div>
    <span>加载中...</span>
  </div>
</template>

<style scoped>
.loading-view {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #666;
  font-size: 18px;
}
.spinner {
  margin-bottom: 10px;
  width: 40px;
  height: 40px;
  border: 5px solid #eee;
  border-top-color: #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
