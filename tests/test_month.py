#!/usr/bin/env python3
"""En måned i brukergrensesnittet: program, logg, reload, tema, dialekt."""
from __future__ import annotations

import os
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from serve import make_server  # noqa: E402

os.environ["SERVE_QUIET"] = "1"


def onboard(page):
    page.goto(page.base, wait_until="networkidle")
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
    page.wait_for_selector("text=I dag")


def main():
    httpd = make_server("127.0.0.1", 0)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}/Trening/"
    from playwright.sync_api import sync_playwright

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": 390, "height": 844},
                locale="nb-NO",
                timezone_id="Europe/Oslo",
                reduced_motion="reduce",
            )
            page = context.new_page()
            page.base = base
            onboard(page)
            page.click("text=Mer")
            page.click("text=Programmer")
            page.click("text=Fullkropp 3 dager")
            page.wait_for_selector("text=I dag")
            page.click(".week button:has-text('man')")
            page.locator("button", has_text="Start").first.click()
            page.wait_for_selector(".sets")
            page.locator(".set").first.locator("input").nth(0).fill("8")
            page.locator(".set").first.locator("input").nth(1).fill("30")
            page.locator(".set").first.locator("button.tick").click()
            if page.locator("text=Hopp over hvilen").count():
                page.click("text=Hopp over hvilen")
            page.reload(wait_until="networkidle")
            page.wait_for_selector("text=Fortsett økten")
            page.click("button[aria-label=Innstillinger]")
            page.locator("select").first.select_option("light")
            theme = page.evaluate("() => document.documentElement.dataset.theme")
            assert theme == "light", theme
            page.click("text=Lukk")
            page.locator("nav button", has_text="Trener").click()
            page.locator("textarea").fill("e det greit å trene sår")
            page.locator("button.btn", has_text="Send").click()
            page.wait_for_selector("text=støl")
            raw = page.evaluate("() => localStorage.getItem('trener_state_v1')")
            assert raw and "Inifi" in raw
            browser.close()
        print("PASS month ui")
    finally:
        httpd.shutdown()
        httpd.server_close()


if __name__ == "__main__":
    main()
