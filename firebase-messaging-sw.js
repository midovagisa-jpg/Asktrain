// FitChat — Service Worker для пуш-уведомлений
// Версия: 1.0 — FCM Background Push
// Разместить рядом с index.html как firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// ⚠️ Замени на данные из Firebase Console → Project Settings → General
firebase.initializeApp({
  apiKey: "AIzaSyADCa1uZpA-rhtmnNcf96UaBxqcY7lDL3M",
  authDomain: "fitchat-6d903.firebaseapp.com",
  databaseURL: "https://fitchat-6d903-default-rtdb.firebaseio.com",
  projectId: "fitchat-6d903",
  storageBucket: "fitchat-6d903.firebasestorage.app",
  messagingSenderId: "1060135785203",
  appId: "1:1060135785203:web:ca4123d7d551ee22889d86"
});

const messaging = firebase.messaging();

// ===== ФОНОВЫЕ СООБЩЕНИЯ (приложение свёрнуто или закрыто) =====
messaging.onBackgroundMessage(function(payload) {
  const data = payload.data || {};
  const type = data.type || 'message';

  let icon = 'icon-192.png';
  let badge = 'favicon-32.png';
  let title = '⚡ FitChat';
  let body = 'Новое событие';
  let tag = data.chatId || 'fitchat';
  let actions = [];
  let vibrate = [200, 100, 200];

  if (type === 'message') {
    title = '💬 ' + (data.from || 'FitChat');
    body = data.text || 'Новое сообщение';
    tag = 'msg_' + (data.chatId || '');
    vibrate = [150, 80, 150];
    actions = [{ action: 'open', title: '✉️ Открыть' }];
  } else if (type === 'call_video') {
    title = '🎥 Входящий видеозвонок';
    body = (data.from || '?') + ' звонит...';
    tag = 'call_' + (data.chatId || '');
    vibrate = [300, 200, 300, 200, 300];
    actions = [
      { action: 'accept', title: '✅ Принять' },
      { action: 'reject', title: '❌ Отклонить' }
    ];
  } else if (type === 'call_audio') {
    title = '📞 Входящий звонок';
    body = (data.from || '?') + ' звонит...';
    tag = 'call_' + (data.chatId || '');
    vibrate = [300, 200, 300, 200, 300];
    actions = [
      { action: 'accept', title: '✅ Принять' },
      { action: 'reject', title: '❌ Отклонить' }
    ];
  } else if (type === 'story') {
    title = '📸 Новая история';
    body = (data.from || '?') + ' опубликовал(а) историю';
    tag = 'story_' + data.from;
    vibrate = [100, 50, 100];
  } else if (type === 'star') {
    title = '✦ Звёзды!';
    body = (data.from || '?') + ' подарил(а) тебе ' + (data.amount || '?') + ' звёзд!';
    tag = 'star_' + data.from;
    vibrate = [200, 100, 200];
  } else if (type === 'like_story') {
    title = '❤️ Лайк!';
    body = (data.from || '?') + ' оценил(а) твою историю';
    tag = 'like_' + data.from;
    vibrate = [100, 50, 100];
  }

  return self.registration.showNotification(title, {
    body,
    icon,
    badge,
    tag,
    vibrate,
    actions,
    data: { url: '/', chatId: data.chatId, type, from: data.from },
    renotify: true,
    requireInteraction: type.startsWith('call')
  });
});

// ===== КЛИК ПО УВЕДОМЛЕНИЮ =====
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data || {};
  const action = event.action;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Если приложение уже открыто — переключаемся на него
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'PUSH_CLICK', action, data });
          return;
        }
      }
      // Иначе открываем новую вкладку
      if (clients.openWindow) {
        return clients.openWindow('/?push=' + encodeURIComponent(JSON.stringify(data)));
      }
    })
  );
});

// ===== PUSH EVENT (прямые web push, не через FCM SDK) =====
self.addEventListener('push', function(event) {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    // FCM SDK обрабатывает сам — этот блок для резервного web push
    if (payload && payload.notification) {
      const n = payload.notification;
      event.waitUntil(
        self.registration.showNotification(n.title || '⚡ FitChat', {
          body: n.body || '',
          icon: 'icon-192.png',
          badge: 'favicon-32.png',
          tag: 'fitchat_push',
          vibrate: [200, 100, 200],
          data: payload.data || {}
        })
      );
    }
  } catch(e) {}
});

