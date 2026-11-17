import unittest

from rollup import iter_totals


class RollupContract(unittest.TestCase):
    def test_first_result_precedes_remaining_input(self):
        def source():
            yield "a", 10
            yield "a", 20
            yield "b", 5
            raise AssertionError("consumed beyond one-record lookahead")

        output = iter(iter_totals(source()))
        try:
            self.assertEqual(next(output), ("a", 30))
        finally:
            close = getattr(output, "close", None)
            if close is not None:
                close()

    def test_empty_and_final_groups(self):
        self.assertEqual(list(iter_totals(iter([]))), [])
        self.assertEqual(list(iter_totals(iter([("z", 7)]))), [("z", 7)])
        self.assertEqual(
            list(iter_totals(iter([("a", 0), ("a", -1), ("b", 8), ("b", 2)]))),
            [("a", -1), ("b", 10)],
        )

    def test_a_one_pass_source(self):
        class Once:
            def __init__(self):
                self.values = iter([("a", 1), ("a", 2), ("b", 3)])
                self.started = False

            def __iter__(self):
                if self.started:
                    raise AssertionError("input iterated twice")
                self.started = True
                return self.values

        self.assertEqual(list(iter_totals(Once())), [("a", 3), ("b", 3)])
