import { useEffect, useState } from "react";
import { FriendService } from "../../../services/FriendService";

const STATUS = {
  ONLINE: { label: "Online", rank: 0 },
  IN_GAME: { label: "In game", rank: 1 },
  OFFLINE: { label: "Offline", rank: 2 },
};

// a null status comes from users created before the status column existed
const statusOf = (friend) => friend.friendStatus ?? "OFFLINE";

const initials = (name) => {
  const words = name.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
};

// friend-request errors come back as a ProblemDetail ({ detail }), 404s as a plain string
const errorText = (err) => {
  const data = err.response?.data;
  if (typeof data === "string" && data) return data;
  return data?.detail || data?.message || err.message;
};

function Avatar({ name, status }) {
  return (
    <span className="friends-avatar position-relative d-flex align-items-center justify-content-center flex-shrink-0">
      {initials(name)}
      {status && (
        <span
          className={`friends-status-dot friends-status-dot--${status.toLowerCase()} position-absolute`}
          title={STATUS[status].label}
        />
      )}
    </span>
  );
}

function SectionTitle({ children }) {
  return <h3 className="friends-section-title mb-2">{children}</h3>;
}

export default function FriendsSidebar() {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // sets to handle if a user accepts multiple friend requests really quickly
  const [busyIds, setBusyIds] = useState(() => new Set());
  const markBusy = (id) => setBusyIds((ids) => new Set(ids).add(id));
  const unmarkBusy = (id) =>
    setBusyIds((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  const [addOpen, setAddOpen] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      FriendService.getFriends(),
      FriendService.getIncomingRequests(),
      FriendService.getOutgoingRequests(),
    ])
      .then(([friendList, incomingList, outgoingList]) => {
        if (ignore) return;
        setFriends(friendList);
        setIncoming(incomingList);
        setOutgoing(outgoingList);
      })
      .catch((err) => !ignore && setError(errorText(err)))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  async function handleAccept(request) {
    markBusy(request.id);
    setError("");
    try {
      const friendship = await FriendService.acceptRequest(request.id);
      setIncoming((list) => list.filter((r) => r.id !== request.id));
      setFriends((list) => [...list, friendship]);
    } catch (err) {
      setError(errorText(err));
    } finally {
      unmarkBusy(request.id);
    }
  }

  async function handleDeny(request) {
    markBusy(request.id);
    setError("");
    try {
      await FriendService.denyRequest(request.id);
      setIncoming((list) => list.filter((r) => r.id !== request.id));
    } catch (err) {
      setError(errorText(err));
    } finally {
      unmarkBusy(request.id);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const id = Number(receiverId);
    if (!Number.isInteger(id) || id <= 0) {
      setError("Enter a valid user ID");
      return;
    }
    setSending(true);
    setError("");
    try {
      const request = await FriendService.sendRequest(id);
      setOutgoing((list) => [...list, request]);
      setReceiverId("");
      setAddOpen(false);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSending(false);
    }
  }

  const sortedFriends = [...friends].sort(
    (a, b) => STATUS[statusOf(a)].rank - STATUS[statusOf(b)].rank,
  );

  return (
    <aside className="friends-sidebar sticky-md-top px-3 pt-3 pb-4">
      <header className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="friends-title m-0">Friends</h2>
        <button
          className="friends-link-button px-2 py-1"
          type="button"
          onClick={() => setAddOpen((open) => !open)}
        >
          {addOpen ? "Close" : "+ Add"}
        </button>
      </header>

      {/* Bullshit solution, you have to write the id now, lowkey we need to make it so you use username or smt */}
      {addOpen && (
        <form className="d-flex gap-2 mb-3" onSubmit={handleSend}>
          <input
            className="friends-input flex-grow-1 px-2 py-1"
            type="number"
            min="1"
            placeholder="User ID"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            autoFocus
          />
          <button className="friends-link-button px-2 py-1" type="submit" disabled={sending}>
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      )}

      {error && (
        <p className="friends-error mb-3 px-2 py-1" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="friends-empty my-2">Loading…</p>
      ) : (
        <>
          {incoming.length > 0 && (
            <section>
              <SectionTitle>Incoming requests</SectionTitle>
              <ul className="list-unstyled m-0">
                {incoming.map((request) => (
                  <li key={request.id} className="d-flex align-items-center gap-3 py-2">
                    <Avatar name={request.sender.username} />
                    <span className="friends-name text-truncate">{request.sender.username}</span>
                    <span className="d-flex gap-1 ms-auto flex-shrink-0">
                      <button
                        className="friends-icon-button d-flex align-items-center justify-content-center p-0"
                        type="button"
                        title="Accept"
                        aria-label={`Accept friend request from ${request.sender.username}`}
                        disabled={busyIds.has(request.id)}
                        onClick={() => handleAccept(request)}
                      >
                        ✓
                      </button>
                      <button
                        className="friends-icon-button d-flex align-items-center justify-content-center p-0"
                        type="button"
                        title="Deny"
                        aria-label={`Deny friend request from ${request.sender.username}`}
                        disabled={busyIds.has(request.id)}
                        onClick={() => handleDeny(request)}
                      >
                        ✕
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              <hr className="friends-divider my-3" />
            </section>
          )}

          <section>
            {sortedFriends.length === 0 ? (
              <p className="friends-empty my-2">No friends yet.</p>
            ) : (
              <ul className="list-unstyled m-0">
                {sortedFriends.map((friend) => {
                  const status = statusOf(friend);
                  return (
                    <li key={friend.friendshipId} className="d-flex align-items-center gap-3 py-2">
                      <Avatar name={friend.friendUsername} status={status} />
                      <span className="friends-info d-flex flex-column">
                        <span className="friends-name text-truncate">{friend.friendUsername}</span>
                        <span className="friends-subtext text-truncate">{STATUS[status].label}</span>
                      </span>
                      {/* TODO: lobby coming soon guys trust */}
                      {status !== "OFFLINE" && (
                        <button
                          className="friends-link-button ms-auto flex-shrink-0 px-2 py-1"
                          type="button"
                          title="Coming soon"
                          disabled
                        >
                          Invite
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {outgoing.length > 0 && (
            <section>
              <hr className="friends-divider my-3" />
              <SectionTitle>Sent requests</SectionTitle>
              <ul className="list-unstyled m-0">
                {outgoing.map((request) => (
                  <li key={request.id} className="friends-row--pending d-flex align-items-center gap-3 py-2">
                    <Avatar name={request.receiver.username} />
                    <span className="friends-name text-truncate">{request.receiver.username}</span>
                    <span className="friends-subtext ms-auto flex-shrink-0">Pending</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </aside>
  );
}
