# Web Session History Viewer

Web Session History Viewer hosts a lightweight web app that mirrors N.I.N.A.'s nightly session data so it can be reviewed from any device on the network.

## Key Capabilities
- Streams session metrics (capture progress, errors, exposure counts) to a browsable dashboard updated in near real time.
- Serves historical logs so operators can inspect previous nights without remoting into the capture PC.
- Exposes configurable port and authentication options to control access on observatory networks.

## Usage Notes
- Deploy the plugin on the capture machine and confirm firewall rules allow inbound HTTP on the configured port.
- Point laptops or tablets to `http://<capture-host>:<port>` to monitor progress during remote observing.
- Archive exported session logs with your other observatory records and note the location in our runbooks for traceability.

Refer to the project's documentation for setup guidance and security considerations.
