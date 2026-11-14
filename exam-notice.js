/* CHM 101 CBT announcement — November 2026. */
(function () {
  'use strict';
  const NOTICE_ID = 'chm101-cbt-2026-11-27';
  const KEY = 'bablo_notice_dismissed_' + NOTICE_ID;
  const EVENT = {
    title: 'CHM 101 CBT Test',
    date: 'Friday, 27 November 2026',
    time: '9:00 AM',
    venue: 'Computer Lab, Old Site',
    starts: '20261127T090000',
    ends: '20261127T110000'
  };

  function addCalendarEvent() {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bablo Hub//CHM 101 CBT//EN',
      'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:' + NOTICE_ID + '@bablohub',
      'DTSTAMP:20261114T000000Z',
      'DTSTART;TZID=Africa/Lagos:' + EVENT.starts,
      'DTEND;TZID=Africa/Lagos:' + EVENT.ends,
      'SUMMARY:CHM 101 CBT Test',
      'LOCATION:Computer Lab\, Old Site',
      'DESCRIPTION:CHM 101 CBT Test. Friday 27 November 2026 at 9:00 AM.',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'CHM-101-CBT-27-November-2026.ics';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function mount() {
    const app = document.getElementById('app');
    if (!app || app.querySelector('[data-bablo-notice="' + NOTICE_ID + '"]')) return;
    if (localStorage.getItem(KEY) === '1') return;

    const card = document.createElement('section');
    card.setAttribute('data-bablo-notice', NOTICE_ID);
    card.setAttribute('role', 'status');
    card.setAttribute('aria-label', 'Important academic announcement');
    card.style.cssText = 'position:relative;display:block;margin:12px 0 16px;padding:16px 16px 14px;border:1px solid rgba(226,190,114,.55);border-left:4px solid #D8B66A;border-radius:16px;background:linear-gradient(120deg,#242A34,#171C24);color:#F3F5F8;box-shadow:0 8px 22px rgba(0,0,0,.2);font:inherit;';
    const label = document.createElement('div');
    label.textContent = 'IMPORTANT NOTICE';
    label.style.cssText = 'font-size:10px;letter-spacing:1.5px;font-weight:900;color:#E2BE72;margin-bottom:7px;';
    const heading = document.createElement('h3');
    heading.textContent = EVENT.title;
    heading.style.cssText = 'font-size:17px;line-height:1.3;margin:0 28px 8px 0;color:#F7F8FA;';
    const details = document.createElement('p');
    details.textContent = EVENT.date + ' · ' + EVENT.time + ' · ' + EVENT.venue;
    details.style.cssText = 'font-size:13px;line-height:1.55;margin:0 0 13px;color:#D5DCE5;';
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;';
    const calendar = document.createElement('button');
    calendar.type = 'button'; calendar.textContent = 'Add to calendar';
    calendar.style.cssText = 'border:1px solid #E8CB8A;border-radius:10px;padding:9px 12px;background:#D8B66A;color:#17130A;font-weight:800;font-size:12px;';
    calendar.addEventListener('click', addCalendarEvent);
    const dismiss = document.createElement('button');
    dismiss.type = 'button'; dismiss.textContent = 'Dismiss';
    dismiss.style.cssText = 'border:1px solid #465261;border-radius:10px;padding:9px 12px;background:#202733;color:#F1F3F6;font-weight:700;font-size:12px;';
    dismiss.addEventListener('click', () => { localStorage.setItem(KEY, '1'); card.remove(); });
    const close = document.createElement('button');
    close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label', 'Dismiss notice');
    close.style.cssText = 'position:absolute;right:10px;top:8px;border:0;background:transparent;color:#C8D0DA;font-size:22px;padding:2px 7px;';
    close.addEventListener('click', () => { localStorage.setItem(KEY, '1'); card.remove(); });
    actions.append(calendar, dismiss);
    card.append(label, heading, details, actions, close);
    app.insertBefore(card, app.firstChild);
  }

  function start() {
    mount();
    const observer = new MutationObserver(mount);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('hashchange', mount);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
