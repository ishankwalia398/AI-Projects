import pytest

from drm_copilot.chunking import chunk_record, chunk_text


def test_1000_character_chunks_have_15_percent_overlap():
    text = "".join(str(index % 10) for index in range(2500))
    chunks = chunk_text(text, chunk_size=1000, overlap_percent=0.15)
    assert [len(chunk) for chunk in chunks] == [1000, 1000, 800]
    assert chunks[0][-150:] == chunks[1][:150]
    assert chunks[1][-150:] == chunks[2][:150]


def test_short_text_stays_in_one_chunk():
    assert chunk_text("short DRM note", 1000, 0.15) == ["short DRM note"]


def test_chunk_metadata_preserves_parent():
    records = chunk_record({"id": "kb-1", "content": "x" * 1200}, 1000, 0.15)
    assert records[0]["id"] == "kb-1-chunk-0000"
    assert records[0]["parent_id"] == "kb-1"
    assert records[1]["chunk_count"] == 2


def test_rejects_invalid_overlap():
    with pytest.raises(ValueError):
        chunk_text("text", 1000, 1.0)
