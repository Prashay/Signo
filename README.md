# MQTT Studio

A modern MQTT Explorer replica. Browse live topic trees, inspect payloads, publish messages, and manage subscriptions.

## Run

```bash
npm install
npm run dev
```

The UI is served on port 7200. A small Node bridge on port 3900 talks to MQTT brokers over TCP/TLS/WebSocket so the browser can connect to any broker.

## Features

- Connect to mqtt / mqtts / ws / wss brokers
- Public presets: HiveMQ, EMQX, Mosquitto test
- Hierarchical topic tree with search
- Pretty JSON, raw text, and hex dump
- Message history per topic
- Publish with QoS and retain
- Pause incoming traffic, clear the tree
- Connection settings stored locally

Connect to `broker.emqx.io:1883` and subscribe to `#` to see live public traffic.
