#!/usr/bin/env bash
python -m uvicorn backend.main:app --reload --port 8000
