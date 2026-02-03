<script>
  // Service Worker: इसके बिना क्रोम 'Install' का ऑप्शन नहीं देता
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('data:application/javascript;base64,c2VsZi5hZGRFdmVudExpc3RlbmVyKCdmZXRjaCcsIGV2ZW50ID0+IHsgfSk7');
    });
  }
</script>
