export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendPushNotification = (title, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Prevent duplicate notifications within the same session if an ID is provided
  if (options.id) {
    const sentKey = `cyclesync_push_sent_${options.id}`;
    if (sessionStorage.getItem(sentKey)) {
      return;
    }
    sessionStorage.setItem(sentKey, 'true');
  }

  const notification = new Notification(title, {
    icon: '/vite.svg', // Assuming standard Vite icon or you can place a logo in public folder
    badge: '/vite.svg',
    ...options
  });

  notification.onclick = function() {
    window.focus();
    this.close();
  };
};
