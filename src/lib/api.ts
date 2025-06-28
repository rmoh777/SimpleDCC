export interface Subscription {
  id: number;
  docket_number: string;
  created_at: number;
}

export async function subscribe(email: string, docket_number: string) {
  const response = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, docket_number })
  });

  const data = await response.json();
  return { data, status: response.status };
}

export async function unsubscribe(email: string, docket_number: string) {
  const response = await fetch('/api/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, docket_number })
  });

  const data = await response.json();
  return { data, status: response.status };
}

export async function getSubscriptions(email: string) {
  const response = await fetch(`/api/subscribe?email=${encodeURIComponent(email)}`);
  const data = await response.json();
  return { data, status: response.status };
} 