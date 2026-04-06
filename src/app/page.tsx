"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { List, Tag, FileText, ClockCounterClockwise } from '@phosphor-icons/react';

export default function ApiTester() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [useProxy, setUseProxy] = useState(false);
  const [params, setParams] = useState([{ key: "", value: "" }]);
  const [response, setResponse] = useState<{
    status: number;
    data: any;
    headers?: Record<string, string>;
    raw?: string;
  } | null>(null);
  const [responseView, setResponseView] = useState<"Pretty" | "Raw">("Pretty");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Body");
  const [history, setHistory] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('apiTesterHistory');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('apiTesterHistory', JSON.stringify(history));
  }, [history]);

  const sendRequest = async () => {
    setError("");
    setLoading(true);
    setResponse(null);
    try {
      // build URL with params
      const queryPairs = params.filter((p) => p.key).map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`);
      const fullUrl = queryPairs.length ? `${url}${url.includes("?") ? "&" : "?"}${queryPairs.join("&")}` : url;
      // convert headers array to object
      const headersObj: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key) headersObj[h.key] = h.value;
      });

      const fetchOptions: any = {
        method,
        headers: headersObj,
      };

      if (method !== "GET" && body) {
        // Set content-type if not provided by user
        if (!Object.keys(headersObj).some((k) => k.toLowerCase() === "content-type")) {
          fetchOptions.headers["Content-Type"] = "application/json";
        }
        fetchOptions.body = body;
      }

      let res: Response;
      if (useProxy) {
        // call local Next.js proxy route which forwards the request
        res = await fetch("/api/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: fullUrl, method, headers: fetchOptions.headers, body: fetchOptions.body }),
        });
        const text = await res.text();
        let parsed = text;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          // keep as text
        }
        setResponse({ status: res.status, data: parsed, raw: text });
      } else {
        res = await fetch(fullUrl, fetchOptions);
        const text = await res.text();
        let parsed: any = text;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          // keep as text
        }
        const responseHeaders: Record<string, string> = {};
        res.headers.forEach((v, k) => (responseHeaders[k] = v));
        setResponse({ status: res.status, data: parsed, headers: responseHeaders, raw: text });
      }
    } catch (err: any) {
      setError(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = () => {
    const request = { url, method, body, headers, params, useProxy };
    setHistory((prev) => [request, ...prev.slice(0, 9)]); // keep last 10
  };

  const loadFromHistory = (req: any) => {
    setUrl(req.url);
    setMethod(req.method);
    setBody(req.body);
    setHeaders(req.headers);
    setParams(req.params);
    setUseProxy(req.useProxy);
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-1 lg:col-span-7 space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Select onValueChange={(v) => setMethod(v ?? "GET")} defaultValue={method}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">
                    <span className="flex items-center gap-2">
                      <span className="text-green-500">GET</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="POST">
                    <span className="flex items-center gap-2">
                      <span className="text-blue-500">POST</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="PUT">
                    <span className="flex items-center gap-2">
                      <span className="text-orange-500">PUT</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="DELETE">
                    <span className="flex items-center gap-2">
                      <span className="text-red-500">DELETE</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="https://api.example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />

              <Button onClick={sendRequest} disabled={loading || !url.trim()}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send"
                )}
              </Button>

              <Button onClick={() => { const req = { url, method, body, headers, params }; setHistory(prev => [req, ...prev]); }}>Save</Button>
            </div>
          </Card>

          <Card className="p-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v ?? "Body")}>
              <TabsList>
                <TabsTrigger value="Params">
                  <List size={16} className="mr-2" />
                  Params
                </TabsTrigger>
                <TabsTrigger value="Headers">
                  <Tag size={16} className="mr-2" />
                  Headers
                </TabsTrigger>
                <TabsTrigger value="Body">
                  <FileText size={16} className="mr-2" />
                  Body
                </TabsTrigger>
                <TabsTrigger value="History">
                  <ClockCounterClockwise size={16} className="mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="Params">
                <div className="space-y-2">
                  {params.map((p, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder="Param name"
                        value={p.key}
                        onChange={(e) => {
                          const next = [...params];
                          next[idx] = { ...next[idx], key: e.target.value };
                          setParams(next);
                        }}
                        className="w-1/2"
                      />
                      <Input
                        placeholder="Param value"
                        value={p.value}
                        onChange={(e) => {
                          const next = [...params];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setParams(next);
                        }}
                        className="flex-1"
                      />
                      <Button onClick={() => setParams((s) => s.filter((_, i) => i !== idx))}>Remove</Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button onClick={() => setParams((s) => [...s, { key: "", value: "" }])}>Add Param</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="Headers">
                <div className="space-y-2">
                  {headers.map((h, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder="Header name"
                        value={h.key}
                        onChange={(e) => {
                          const next = [...headers];
                          next[idx] = { ...next[idx], key: e.target.value };
                          setHeaders(next);
                        }}
                        className="w-1/2"
                      />
                      <Input
                        placeholder="Header value"
                        value={h.value}
                        onChange={(e) => {
                          const next = [...headers];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setHeaders(next);
                        }}
                        className="flex-1"
                      />
                      <Button onClick={() => setHeaders((s) => s.filter((_, i) => i !== idx))}>Remove</Button>
                    </div>
                  ))}

                  <div className="flex items-center gap-4">
                    <Button onClick={() => setHeaders((s) => [...s, { key: "", value: "" }])}>Add Header</Button>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={useProxy} onChange={(e) => setUseProxy(e.target.checked)} />
                      <span>Use proxy</span>
                    </label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="Body">
                <Textarea
                  placeholder='{"key": "value"}'
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[160px]"
                />
              </TabsContent>

              <TabsContent value="History">
                <div className="space-y-2">
                  <Button onClick={saveToHistory}>Save Current Request</Button>
                  {history.map((req, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{req.method} {req.url}</span>
                      <Button onClick={() => loadFromHistory(req)}>Load</Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="col-span-1 lg:col-span-5">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Response</h3>
                <span className="text-sm text-muted-foreground">{response ? `${response.status}` : "-"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => { setResponse(null); setError(""); }}>Clear</Button>
                <Button onClick={() => { if (response) navigator.clipboard?.writeText(responseView === "Pretty" ? JSON.stringify(response.data, null, 2) : (response.raw || "")); }} disabled={!response}>Copy</Button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Headers</div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-36">{response?.headers ? JSON.stringify(response.headers, null, 2) : "-"}</pre>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Body</div>
                  <div>
                    <Button onClick={() => setResponseView("Pretty")} variant={responseView === "Pretty" ? "default" : "outline"}>Pretty</Button>
                    <Button onClick={() => setResponseView("Raw")} variant={responseView === "Raw" ? "default" : "outline"}>Raw</Button>
                  </div>
                </div>
                <div className="mt-2 bg-black text-green-200 p-3 rounded overflow-auto max-h-80">
                  {response ? (
                    responseView === "Pretty" ? (
                      <SyntaxHighlighter language="json" style={oneDark} customStyle={{ margin: 0, padding: 0, background: 'transparent', fontSize: '14px' }}>
                        {JSON.stringify(response.data, null, 2)}
                      </SyntaxHighlighter>
                    ) : (
                      <pre className="text-sm">{response.raw}</pre>
                    )
                  ) : (
                    <pre className="text-sm">Response will appear here</pre>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}