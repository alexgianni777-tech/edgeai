import unittest
from datetime import date
from tools.asset_screen_brief import evaluate, render

class BriefTests(unittest.TestCase):
    def setUp(self):
        self.today = date(2026, 11, 2)
        self.base = dict(side="SHORT", price=100, stop=105, target=90,
                         price_date="2026-11-02", earnings_verified=True,
                         earnings_date="2026-12-01", volume_ratio=1.1)

    def test_watch_is_not_entry(self):
        status, flags, rr = evaluate(self.base, "2026-11-02", self.today)
        self.assertEqual(status, "WATCH")
        self.assertEqual(rr, 2.0)

    def test_stale_data_blocks(self):
        c = {**self.base, "price_date": "2026-10-29"}
        self.assertIn("STALE_PRICE", evaluate(c, "2026-10-29", self.today)[1])

    def test_earnings_unknown_blocks(self):
        c = {**self.base, "earnings_verified": False}
        self.assertEqual(evaluate(c, "2026-11-02", self.today)[0], "BLOCKED")

    def test_upcoming_earnings_blocks(self):
        c = {**self.base, "earnings_date": "2026-11-03"}
        self.assertIn("EARNINGS_WINDOW", evaluate(c, "2026-11-02", self.today)[1])

    def test_invalid_short_stop_blocks(self):
        c = {**self.base, "stop": 95}
        self.assertIn("LOW_OR_INVALID_RR", evaluate(c, "2026-11-02", self.today)[1])

    def test_no_candidates(self):
        self.assertIn("NO TRADE", render({"candidates": []}, self.today))

if __name__ == "__main__":
    unittest.main()
