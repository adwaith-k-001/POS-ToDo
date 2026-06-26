export async function fetcher(url: string) {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json;
}
