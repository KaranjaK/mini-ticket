#Tests to be used on testing the APIs are working
#The tests are created with an aim of answering the qustions, given, when, then in that order
from rest_framework.test import APITestCase

from .models import Ticket


class TicketApiTests(APITestCase):
    def test_create_ticket_applies_defaults(self):
        res = self.client.post("/tickets", {"title": "Printer on fire"}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["status"], "open")
        self.assertEqual(res.data["priority"], "medium")
        self.assertIn("created_at", res.data)
        self.assertEqual(Ticket.objects.count(), 1)

    def test_create_requires_title(self):
        res = self.client.post("/tickets", {"description": "no title"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("title", res.data)

    def test_list_filters_by_status_and_paginates(self):
        for i in range(5):
            Ticket.objects.create(title=f"open {i}")
        Ticket.objects.create(title="done", status="closed")

        res = self.client.get("/tickets?status=open&page=2&limit=2")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 5)
        self.assertEqual(len(res.data["results"]), 2)
        self.assertTrue(all(t["status"] == "open" for t in res.data["results"]))

        self.assertEqual(self.client.get("/tickets?status=bogus").status_code, 400)

    def test_patch_updates_status_and_priority_only(self):
        t = Ticket.objects.create(title="Original")
        res = self.client.patch(
            f"/tickets/{t.id}", {"status": "in_progress", "priority": "high", "title": "Hacked"}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        t.refresh_from_db()
        self.assertEqual((t.status, t.priority, t.title), ("in_progress", "high", "Original"))

        bad = self.client.patch(f"/tickets/{t.id}", {"status": "nope"}, format="json")
        self.assertEqual(bad.status_code, 400)

    def test_stats_counts_by_status_including_zeros(self):
        Ticket.objects.create(title="a")
        Ticket.objects.create(title="b")
        Ticket.objects.create(title="c", status="closed")
        res = self.client.get("/tickets/stats")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"open": 2, "in_progress": 0, "closed": 1})