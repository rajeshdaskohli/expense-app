<link rel="manifest" href="manifest.json">

<script>
  // Service Worker को रजिस्टर करें
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js');
    });
  }
</script>
