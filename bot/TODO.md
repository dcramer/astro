# TODO

## Done
- [x] Project setup (package.json, tsconfig, wrangler.toml)
- [x] Astrospheric API integration with types
- [x] Night scoring algorithm
- [x] Telegram notification module
- [x] Cloudflare Workers handler with cron trigger
- [x] Manual trigger endpoints (/check, /forecast, /health)

## Next Up
- [ ] Test with real Astrospheric API key
- [ ] Deploy to Cloudflare Workers
- [ ] Set up secrets (bot token, chat ID, API key, coordinates)
- [ ] Verify cron triggers are working

## Future Enhancements
- [ ] Add moon phase/illumination to notifications
- [ ] Include astronomical twilight times
- [ ] Add "imaging window" calculation (best consecutive hours)
- [ ] Support multiple notification channels/groups
- [ ] Add /subscribe command for Telegram bot interaction
- [ ] Store notification history in KV to avoid duplicate alerts
- [ ] Add weather trend analysis (improving/worsening)
- [ ] Include target suggestions based on current sky position
- [ ] Integrate with N.I.N.A. Target Scheduler data
