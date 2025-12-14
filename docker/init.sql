-- VS Arena Database Schema
-- Version: 1.0
-- Date: 2025-12-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents Table
CREATE TABLE agents (
  agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  persona_json JSONB NOT NULL DEFAULT '{}',
  params_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agents_created_at ON agents(created_at DESC);

-- Runs Table
CREATE TABLE runs (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  agent_a_id UUID NOT NULL REFERENCES agents(agent_id),
  agent_b_id UUID NOT NULL REFERENCES agents(agent_id),
  agent_j_id UUID NOT NULL REFERENCES agents(agent_id),
  position_a TEXT NOT NULL,
  position_b TEXT NOT NULL,
  config_json JSONB NOT NULL DEFAULT '{"rounds": 3}',
  rubric_json JSONB NOT NULL DEFAULT '{}',
  result_json JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);

CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_created_at ON runs(created_at DESC);

-- Turns Table
CREATE TABLE turns (
  turn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(agent_id),
  phase VARCHAR(30) NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  targets JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_turns_run_id ON turns(run_id);
CREATE INDEX idx_turns_phase ON turns(phase);
CREATE INDEX idx_turns_created_at ON turns(created_at);

-- Update updated_at trigger for agents
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development (optional)
-- Uncomment to insert sample agents

-- INSERT INTO agents (name, model, persona_json, params_json) VALUES
-- ('Logical Analyst', 'llama3', 
--  '{"tone": "formal", "values": ["logic", "evidence"], "thinking_style": "analytical"}',
--  '{"temperature": 0.7, "top_p": 0.9, "max_tokens": 1024}'),
-- ('Creative Thinker', 'qwen2.5',
--  '{"tone": "casual", "values": ["creativity", "innovation"], "thinking_style": "creative"}',
--  '{"temperature": 0.9, "top_p": 0.95, "max_tokens": 1024}'),
-- ('Balanced Judge', 'llama3',
--  '{"tone": "formal", "values": ["fairness", "objectivity"], "thinking_style": "balanced"}',
--  '{"temperature": 0.5, "top_p": 0.85, "max_tokens": 2048}');
