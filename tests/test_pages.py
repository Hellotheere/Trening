#!/usr/bin/env python3
"""Playwright: last appen under /Trening/, onboarding, mandagsplan, logg, persistens."""
from __future__ import annotations

import os
import re
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from serve import make_server  # noqa: E402

OUT = ROOT / "screenshots"
OUT.mkdir(exist_ok=True)


def start_server():
    os.environ["SERVE_QUIET"] = "1"
    httpd = make_server("127.0.0.1", 0)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    host, port = httpd.server_address
    return httpd, f"http://127.0.0.1:{port}/Trening/"


def main():
    from playwright.sync_api import expect, sync_playwright

    httpd, base = start_server()
    print("serving", base, flush=True)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": 390, "height": 844},
                device_scale_factor=2,
                user_agent=(
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
                ),
                locale="nb-NO",
                timezone_id="Europe/Oslo",
            )
            page = context.new_page()
            page.goto(base, wait_until="networkidle")
            page.wait_for_selector("text=Vi lager en plan som passer deg")

            page.click("text=Bygge muskler")
            page.click("text=Neste")
            page.click("text=Litt erfaring")
            page.click("text=Neste")
            page.click("text=4 dager")
            page.click("text=45 min")
            page.click("text=Neste")
            page.click("text=Treningssenter")
            page.click("text=Neste")
            page.fill('input[placeholder="F.eks. Inifi"]', "Inifi")
            page.click("text=Neste")
            page.click("text=Lag planen min")
            page.wait_for_selector(".switch")
            page.click("text=Min egen plan")
            page.wait_for_selector("text=Rediger uken")
            page.click(".week button:has-text('man')")
            page.wait_for_selector("text=Bryst, armer og skuldre")
            page.wait_for_selector("text=Brystpress i maskin")
            time.sleep(0.35)
            page.screenshot(path=str(OUT / "own-plan-monday.png"), full_page=False)

            page.click("text=Start denne økten")
            page.wait_for_selector(".sets")
            # Første øvelse: logg ett sett 12 reps × 40 kg
            reps = page.locator(".set").first.locator("input").nth(0)
            kg = page.locator(".set").first.locator("input").nth(1)
            reps.fill("12")
            kg.fill("40")
            page.locator(".set").first.locator("button.tick").click()
            # hopp over hvilen hvis timeren dukker opp
            if page.locator("text=Hopp over hvilen").count():
                page.click("text=Hopp over hvilen")
            page.wait_for_selector(".tick.on")
            time.sleep(0.35)
            page.screenshot(path=str(OUT / "workout-logged.png"), full_page=False)

            page.reload(wait_until="networkidle")
            # Persistens i localStorage
            raw = page.evaluate("() => localStorage.getItem('trener_state_v1')")
            assert raw, "localStorage mangler trener_state_v1 etter reload"
            persisted = page.evaluate(
                """() => {
                  const s = JSON.parse(localStorage.getItem('trener_state_v1') || '{}');
                  const w = (s.workouts || [])[0] || {};
                  const ex = (w.exercises || [])[0] || {};
                  const set0 = (ex.sets || [])[0] || {};
                  return {
                    source: s.plan_source,
                    name: (s.profile || {}).name,
                    date: w.date,
                    id: ex.id,
                    reps: set0.reps,
                    kg: set0.weight_kg,
                    done: set0.done,
                  };
                }"""
            )
            assert persisted["name"] == "Inifi", persisted
            assert persisted["source"] == "custom", persisted
            assert persisted["id"] == "maskin_brystpress", persisted
            assert int(persisted["reps"]) == 12, persisted
            assert float(persisted["kg"]) == 40, persisted
            assert persisted["done"] is True, persisted

            # UI etter reload: åpne mandagsøkten igjen og sjekk at settet er huket av
            page.wait_for_selector(".switch")
            if page.locator("text=Min egen plan").count():
                # kan allerede være valgt
                on = page.locator(".switch button.on")
                if "Min egen plan" not in (on.inner_text() if on.count() else ""):
                    page.click("text=Min egen plan")
            page.click(".week button:has-text('man')")
            page.click("text=Start denne økten")
            page.wait_for_selector(".sets")
            if page.locator("text=Hopp over hvilen").count():
                page.click("text=Hopp over hvilen")
            expect(page.locator(".set").first.locator("input").nth(0)).to_have_value("12")
            expect(page.locator(".set").first.locator("input").nth(1)).to_have_value("40")
            expect(page.locator(".set").first.locator("button.tick")).to_have_class(re.compile(r"\bon\b"))
            browser.close()
        print("PASS screenshots:", OUT / "own-plan-monday.png", OUT / "workout-logged.png")
    finally:
        httpd.shutdown()
        httpd.server_close()


if __name__ == "__main__":
    main()
