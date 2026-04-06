"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sun, Moon, Folder, Plus } from '@phosphor-icons/react';

export default function ApiTester() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }]);
  const [params, setParams] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }]);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
  const [selectedCollection, setSelectedCollection] = useState<number | null>(0);

  const sendRequest = async () => {
    setLoading(true);
    setResponse(null);
    try {
      // convert headers to object
      const headersObj: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key) headersObj[h.key] = h.value;
      });

      // build URL with params
      let fullUrl = url;
      const paramsObj = new URLSearchParams();
      params.forEach((p) => {
        if (p.key) paramsObj.append(p.key, p.value);
      });
      if (paramsObj.toString()) {
        fullUrl += (url.includes('?') ? '&' : '?') + paramsObj.toString();
      }

      const startTime = Date.now();

      const opts: any = { method, headers: headersObj };
      if (method !== "GET" && body) opts.body = body;

      const res = await fetch(fullUrl, opts);
      const text = await res.text();
      const duration = Date.now() - startTime;
      let data: any = text;
      try {
        data = JSON.parse(text);
      } catch (e) {
        // keep text
      }

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => (responseHeaders[k] = v));

      setResponse({ status: res.status, data, headers: responseHeaders, time: duration, size: text.length });
    } catch (err: any) {
      setResponse({ error: err?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      {/* Sidebar */}
      <div className={`w-64 border-r p-4 ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Collections</h2>
            <p className="text-sm text-muted-foreground mt-1">Organize saved requests</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // placeholder: add new collection logic
              setSelectedCollection(null);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={14} /> New
          </Button>
        </div>

        <div className="mt-3">
          <Input placeholder="Search collections..." className="w-full" />
        </div>

        <ul className="mt-4 space-y-2">
          {["GET /users", "POST /login"].map((label, idx) => (
            <li
              key={idx}
              onClick={() => setSelectedCollection(idx)}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors duration-100 ${
                selectedCollection === idx
                  ? theme === "dark"
                    ? "bg-gray-700"
                    : "bg-gray-200"
                  : theme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              }`}
            >
              <Folder size={16} />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className={`flex gap-2 p-4 border-b items-center ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <select
            className="border rounded px-2 h-10"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
          </select>

          <Input
            placeholder="https://api.example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />

          <span
            className={`px-2 py-1 rounded text-sm font-semibold mr-2 ${
              method === "GET"
                ? "bg-green-100 text-green-800"
                : method === "POST"
                ? "bg-blue-100 text-blue-800"
                : method === "PUT"
                ? "bg-amber-100 text-amber-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {method}
          </span>

          <Button onClick={sendRequest} disabled={loading || !url.trim()}>
            {loading ? "Sending..." : "Send"}
          </Button>

          <div className="ml-2">
            <Badge variant="secondary">{response?.status ?? "-"}</Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="ml-2"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="body" className="flex-1 flex flex-col">
            <TabsList className="px-4">
              <TabsTrigger value="params">Params</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
            </TabsList>

            <TabsContent value="params" className="p-4 flex-1 overflow-auto">
              <div className="space-y-2">
                {params.map((param, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Key"
                      value={param.key}
                      onChange={(e) => {
                        const newParams = [...params];
                        newParams[index].key = e.target.value;
                        setParams(newParams);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={param.value}
                      onChange={(e) => {
                        const newParams = [...params];
                        newParams[index].value = e.target.value;
                        setParams(newParams);
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newParams = params.filter((_, i) => i !== index);
                        setParams(newParams.length ? newParams : [{ key: "", value: "" }]);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setParams([...params, { key: "", value: "" }])}
                >
                  Add Param
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="headers" className="p-4 flex-1 overflow-auto">
              <div className="space-y-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input
                      placeholder="Key"
                      value={h.key}
                      onChange={(e) => {
                        const next = [...headers];
                        next[i] = { ...next[i], key: e.target.value };
                        setHeaders(next);
                      }}
                    />
                    <Input
                      placeholder="Value"
                      value={h.value}
                      onChange={(e) => {
                        const next = [...headers];
                        next[i] = { ...next[i], value: e.target.value };
                        setHeaders(next);
                      }}
                    />
                    <Button onClick={() => setHeaders((s) => s.filter((_, idx) => idx !== i))}>Remove</Button>
                  </div>
                ))}

                <div>
                  <Button onClick={() => setHeaders((s) => [...s, { key: "", value: "" }])}>Add Header</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="body" className="p-4 flex-1">
              <Textarea placeholder="JSON body..." value={body} onChange={(e) => setBody(e.target.value)} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Response Panel */}
        <div className="h-1/2 border-t p-4 overflow-auto rounded-t-xl bg-gray-500 text-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm">Status</div>
              <div
                className={`px-2 py-1 rounded font-semibold text-sm ${
                  response?.status >= 200 && response?.status < 300
                    ? "bg-emerald-100 text-emerald-800"
                    : response?.status >= 400 && response?.status < 500
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {response?.status ?? "-"}
              </div>

              {response?.time && <div className="text-xs text-slate-400">{response.time}ms</div>}
              {response?.size && <div className="text-xs text-slate-400">{response.size} bytes</div>}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (response) navigator.clipboard?.writeText(JSON.stringify(response.data, null, 2));
                }}
                disabled={!response}
              >
                Copy
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setResponse(null)}
              >
                Clear
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setViewMode(viewMode === "formatted" ? "raw" : "formatted")}
              >
                {viewMode === "formatted" ? "Raw" : "Formatted"}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-slate-300">Headers</div>
              <pre className="mt-2 text-xs bg-slate-800 p-2 rounded max-h-32 overflow-auto">{response?.headers ? JSON.stringify(response.headers, null, 2) : "-"}</pre>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-300">Body</div>
              </div>
              <div className="mt-2">
                {response ? (
                  viewMode === "formatted" ? (
                    <SyntaxHighlighter language="json" style={oneDark} className="text-sm rounded max-h-64 overflow-auto">
                      {JSON.stringify(response.data, null, 2)}
                    </SyntaxHighlighter>
                  ) : (
                    <pre className="text-sm bg-slate-800 p-3 rounded max-h-64 overflow-auto text-slate-100">
                      {typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2)}
                    </pre>
                  )
                ) : (
                  <div className="text-sm text-slate-400">Response will appear here</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
