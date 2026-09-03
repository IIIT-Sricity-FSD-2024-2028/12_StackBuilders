(function () {
  const QUERY_STORAGE_KEY = "stackbuilders.queries.v1";

  // --- STORAGE LOGIC ---
  const readQueries = () => {
    try {
      const raw = window.localStorage.getItem(QUERY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  const writeQueries = (queries) => {
    try {
      window.localStorage.setItem(QUERY_STORAGE_KEY, JSON.stringify(queries));
      if (window.appApiClient?.request) {
        window.appApiClient.request("/queries/bulk", {
          method: "PUT",
          json: queries
        }).catch(e => console.error("Failed to sync queries:", e));
      }
    } catch (e) {}
  };

  const syncQueriesWithBackend = async () => {
    if (window.appApiClient?.request) {
      try {
        const backendQueries = await window.appApiClient.request("/queries");
        if (Array.isArray(backendQueries)) {
          // Update local cache to match backend
          window.localStorage.setItem(QUERY_STORAGE_KEY, JSON.stringify(backendQueries));
          window.dispatchEvent(new Event('queriesSynced'));
        }
      } catch (e) {
        console.error("Failed to load queries from backend:", e);
      }
    }
  };

  const getCurrentUserSession = () => {
    const employee = window.employeeAuthStore?.getCurrentEmployee?.();
    if (employee) return { type: 'Employee', ...employee };

    const expert = window.expertAuthStore?.getCurrentExpert?.();
    if (expert) return { type: 'Expert', ...expert };

    const hr = window.hrAuthStore?.getCurrentHr?.();
    if (hr) return { type: 'HR', ...hr };

    return null;
  };

  const submitQuery = (description) => {
    const user = getCurrentUserSession();
    if (!user) {
      alert("You must be logged in to submit a query.");
      return;
    }
    const queries = readQueries();
    queries.push({
      id: "Q-" + Date.now(),
      userId: user.id || user.email,
      userEmail: user.email,
      userName: user.name || user.email,
      userType: user.type,
      companyName: user.companyName || user.company || "N/A",
      description,
      status: "Open", // Open, Replied
      reply: "",
      createdAt: Date.now(),
      readBySender: false
    });
    writeQueries(queries);
    alert("Query submitted successfully! We will get back to you soon.");
  };

  // --- CONTACT US MODAL UI ---
  const injectModal = () => {
    if (document.getElementById("queryModal")) return;

    const modalHtml = `
      <div id="queryModal" class="modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; justify-content: center; align-items: center;">
        <div style="background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="margin-top: 0;">Contact Us / Submit Query</h2>
          <p style="margin-bottom: 1rem; color: #666;">Describe your query and our supervisor will get back to you.</p>
          <textarea id="queryDescription" rows="5" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 1rem; font-family: inherit; resize: vertical;" placeholder="How can we help?"></textarea>
          <div style="display: flex; justify-content: flex-end; gap: 1rem;">
            <button id="cancelQueryBtn" style="padding: 0.5rem 1rem; border: none; background: #f3f4f6; color: #333; border-radius: 4px; cursor: pointer;">Cancel</button>
            <button id="submitQueryBtn" style="padding: 0.5rem 1rem; border: none; background: #ff914d; color: white; border-radius: 4px; cursor: pointer;">Submit Query</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById("queryModal");
    const cancelBtn = document.getElementById("cancelQueryBtn");
    const submitBtn = document.getElementById("submitQueryBtn");
    const textarea = document.getElementById("queryDescription");

    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
      textarea.value = "";
    });

    submitBtn.addEventListener("click", () => {
      const text = textarea.value.trim();
      if (!text) {
        alert("Please enter a description.");
        return;
      }
      submitQuery(text);
      modal.style.display = "none";
      textarea.value = "";
    });
  };

  // --- NOTIFICATION OVERLAY UI ---
  const injectNotificationStyles = () => {
    if (document.getElementById("query-notif-styles")) return;
    const style = document.createElement("style");
    style.id = "query-notif-styles";
    style.textContent = `
      .notif-bell-wrapper {
        position: relative;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
      }
      .notif-badge {
        position: absolute;
        top: -6px;
        right: -8px;
        background: #ef4444;
        color: white;
        font-size: 10px;
        font-weight: 700;
        min-width: 16px;
        height: 16px;
        border-radius: 99px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        line-height: 1;
        pointer-events: none;
      }
      .notif-overlay {
        display: none;
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        width: 360px;
        max-height: 420px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.18);
        z-index: 10001;
        overflow: hidden;
        flex-direction: column;
      }
      .notif-overlay.open {
        display: flex;
      }
      .notif-overlay-header {
        padding: 14px 16px;
        border-bottom: 1px solid #eee;
        font-weight: 700;
        font-size: 15px;
        color: #222;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }
      .notif-overlay-header .mark-all-read {
        font-size: 12px;
        font-weight: 500;
        color: #ff914d;
        cursor: pointer;
        border: none;
        background: none;
        padding: 0;
      }
      .notif-overlay-header .mark-all-read:hover {
        text-decoration: underline;
      }
      .notif-overlay-body {
        overflow-y: auto;
        flex: 1;
      }
      .notif-item {
        padding: 12px 16px;
        border-bottom: 1px solid #f3f4f6;
        cursor: default;
        transition: background 0.15s;
      }
      .notif-item:hover {
        background: #fafafa;
      }
      .notif-item.unread {
        background: #fff7ed;
        border-left: 3px solid #ff914d;
      }
      .notif-item .notif-title {
        font-size: 13px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }
      .notif-item .notif-query {
        font-size: 12px;
        color: #888;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .notif-item .notif-reply {
        font-size: 12px;
        color: #222;
        background: #f3f4f6;
        padding: 6px 8px;
        border-radius: 4px;
        margin-bottom: 4px;
      }
      .notif-item .notif-time {
        font-size: 11px;
        color: #aaa;
      }
      .notif-item .notif-dismiss {
        float: right;
        background: none;
        border: none;
        color: #bbb;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        padding: 0;
        margin-top: -2px;
      }
      .notif-item .notif-dismiss:hover {
        color: #666;
      }
      .notif-empty {
        padding: 32px 16px;
        text-align: center;
        color: #aaa;
        font-size: 13px;
      }
    `;
    document.head.appendChild(style);
  };

  const setupBellNotifications = () => {
    const user = getCurrentUserSession();
    if (!user) return; // Only for logged-in employees/experts/HR

    injectNotificationStyles();

    // Find the bell icon in the header
    const bellIcon = document.querySelector('.nav-right .fa-bell');
    if (!bellIcon) return;

    // Wrap the bell icon in a container for positioning
    const wrapper = document.createElement('span');
    wrapper.className = 'notif-bell-wrapper';
    bellIcon.parentNode.insertBefore(wrapper, bellIcon);
    wrapper.appendChild(bellIcon);

    // Create the badge (count of unread)
    const badge = document.createElement('span');
    badge.className = 'notif-badge';
    badge.style.display = 'none';
    wrapper.appendChild(badge);

    // Create the overlay panel
    const overlay = document.createElement('div');
    overlay.className = 'notif-overlay';
    overlay.innerHTML = `
      <div class="notif-overlay-header">
        <span>Notifications</span>
        <button class="mark-all-read">Mark all read</button>
      </div>
      <div class="notif-overlay-body"></div>
    `;
    wrapper.appendChild(overlay);

    // Toggle overlay on bell click
    wrapper.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = overlay.classList.contains('open');
      if (isOpen) {
        overlay.classList.remove('open');
      } else {
        renderNotifications();
        overlay.classList.add('open');
      }
    });

    // Prevent overlay clicks from closing it
    overlay.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    // Close overlay when clicking elsewhere
    document.addEventListener('click', function() {
      overlay.classList.remove('open');
    });

    // Mark all read button
    overlay.querySelector('.mark-all-read').addEventListener('click', function(e) {
      e.stopPropagation();
      var queries = readQueries();
      var changed = false;
      queries.forEach(function(q) {
        if (q.userEmail === user.email && q.status === 'Replied' && !q.readBySender) {
          q.readBySender = true;
          changed = true;
        }
      });
      if (changed) writeQueries(queries);
      renderNotifications();
    });

    function formatTimeAgo(timestamp) {
      var diff = Date.now() - timestamp;
      var mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return mins + 'm ago';
      var hrs = Math.floor(mins / 60);
      if (hrs < 24) return hrs + 'h ago';
      var days = Math.floor(hrs / 24);
      return days + 'd ago';
    }

    function renderNotifications() {
      var queries = readQueries();
      // Get all replied queries for this user (both read and unread)
      var myReplies = queries.filter(function(q) {
        return q.userEmail === user.email && q.status === 'Replied';
      }).sort(function(a, b) {
        return b.createdAt - a.createdAt;
      });

      var unreadCount = myReplies.filter(function(q) { return !q.readBySender; }).length;

      // Update badge
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }

      // Render overlay body
      var body = overlay.querySelector('.notif-overlay-body');
      if (myReplies.length === 0) {
        body.innerHTML = '<div class="notif-empty"><i class="fa fa-bell-slash" style="font-size:24px;margin-bottom:8px;display:block;"></i>No notifications yet</div>';
        return;
      }

      var html = '';
      myReplies.forEach(function(q) {
        var isUnread = !q.readBySender;
        html += '<div class="notif-item' + (isUnread ? ' unread' : '') + '" data-notif-id="' + q.id + '">';
        html += '<button class="notif-dismiss" data-dismiss-id="' + q.id + '" title="Dismiss">&times;</button>';
        html += '<div class="notif-title">Supervisor replied to your query</div>';
        html += '<div class="notif-query"><strong>You:</strong> ' + q.description + '</div>';
        html += '<div class="notif-reply"><strong>Reply:</strong> ' + q.reply + '</div>';
        html += '<div class="notif-time">' + formatTimeAgo(q.createdAt) + '</div>';
        html += '</div>';
      });
      body.innerHTML = html;

      // Add dismiss handlers
      body.querySelectorAll('.notif-dismiss').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var qId = btn.getAttribute('data-dismiss-id');
          var allQ = readQueries();
          var idx = allQ.findIndex(function(q) { return q.id === qId; });
          if (idx > -1) {
            allQ[idx].readBySender = true;
            writeQueries(allQ);
          }
          renderNotifications();
        });
      });

      // Mark item as read when clicked
      body.querySelectorAll('.notif-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
          e.stopPropagation();
          var qId = item.getAttribute('data-notif-id');
          var allQ = readQueries();
          var idx = allQ.findIndex(function(q) { return q.id === qId; });
          if (idx > -1 && !allQ[idx].readBySender) {
            allQ[idx].readBySender = true;
            writeQueries(allQ);
            renderNotifications();
          }
        });
      });
    }

    // Initial badge update (don't open overlay, just show count)
    renderNotifications();
  };

  // --- INIT ---
  window.addEventListener("DOMContentLoaded", async () => {
    await syncQueriesWithBackend();
    injectModal();
    setupBellNotifications();

    document.body.addEventListener("click", (e) => {
      const trigger = e.target.closest(".contact-us-trigger");
      if (trigger) {
        e.preventDefault();
        const modal = document.getElementById("queryModal");
        if (modal) {
          modal.style.display = "flex";
        }
      }
    });
  });

  window.querySystem = {
    readQueries,
    writeQueries,
    syncQueriesWithBackend
  };
})();
