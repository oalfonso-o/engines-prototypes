extends GutTest

const ScoreCountupScript := preload("res://runtime/ui/logic/score_countup.gd")


func test_score_countup_animates_up_to_final_score() -> void:
	var countup = ScoreCountupScript.new(12, 12.0)

	assert_eq(countup.displayed_score, 0, "countup should start from zero")
	countup.advance(0.5)
	assert_true(countup.displayed_score > 0, "countup should advance after elapsed time")
	assert_true(countup.displayed_score < 12, "countup should not jump to the end immediately")
	countup.advance(1.0)
	assert_eq(countup.displayed_score, 12, "countup should finish at the final score")
	assert_true(countup.is_complete, "countup should report completion once the final score is reached")
