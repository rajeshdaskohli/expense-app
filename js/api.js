// API base URL (यहाँ अपना Apps Script Web App URL paste करें)
const API_URL = "https://script.google.com/macros/s/AKfycbyUxy4omEAx6jP5dVGPUrM3-rqEHE7cznUhFHocuhEb61jKnWAXzQ6VRO5vl6YkeT9R/exec";

function apiGet(action) {
  return fetch(`${API_URL}?action=${action}`)
    .then(res => res.json());
}

function apiPost(action, data) {
  return fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action, ...data })
  }).then(res => res.json());
}
