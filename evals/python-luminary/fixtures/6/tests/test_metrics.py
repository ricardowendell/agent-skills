import unittest

from metrics import average


class AverageContract(unittest.TestCase):
    def test_empty_is_absence(self):
        self.assertIsNone(average([]))

    def test_nonempty_behavior(self):
        for values, expected in [
            ([2.0, 4.0], 3.0),
            ([0.0], 0.0),
            ([-3.0, 3.0], 0.0),
            ([1.0, 2.0, 3.0, 4.0], 2.5),
        ]:
            with self.subTest(values=values):
                self.assertEqual(average(values), expected)

    def test_input_is_unchanged(self):
        values = [1.0, 4.0]
        before = values.copy()
        average(values)
        self.assertEqual(values, before)
