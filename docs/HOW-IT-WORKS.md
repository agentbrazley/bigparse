# How BigParse Works with Claude

## The Key Output That Shows It's Working

### 1. **When Claude Uses BigParse Tools**
You'll see Claude make tool calls like this:

```
Claude is using the search_code tool:
- Query: "interface WebSocketCommand"
- File types: [".ts", ".tsx"]
- Limit: 5
```

### 2. **The Results Claude Gets Back**
```json
{
  "content": [{
    "type": "text",
    "text": {
      "results": [{
        "file": "/Users/you/project/src/websocket-client.ts",
        "matches": [{
          "line": 3,
          "text": "export interface WebSocketCommand {",
          "column": 7
        }]
      }]
    }
  }]
}
```

### 3. **How You Know It's Working**

✅ **Speed**: Claude finds code instantly (milliseconds not seconds)
✅ **Precision**: Exact file paths and line numbers
✅ **No Context Waste**: Claude doesn't ask you to paste files
✅ **Smart Navigation**: Claude can trace through your codebase

## Real Usage Example

**Without BigParse:**
```
You: "How does the WebSocket connection work in my app?"
Claude: "I'll need to see your WebSocket-related files. Could you share:
- Your WebSocket client code
- The server connection logic  
- Any WebSocket utilities or types"
You: *pastes 3-4 large files*
[Uses 5000+ tokens of context]
```

**With BigParse:**
```
You: "How does the WebSocket connection work in my app?"
Claude: Let me search your codebase for WebSocket implementations...

[Claude internally uses: search_code("WebSocket")]
Found WebSocket code in 3 files:
- websocket-client.ts (main client)
- websocket-bridge.ts (connection handler)  
- types/websocket.ts (type definitions)

[Claude internally uses: get_symbols("websocket-bridge.ts")]
I can see the main connection logic is in the `WebSocketBridge` class
with these key methods:
- connect() at line 23
- handleMessage() at line 45
- reconnect() at line 67

Your WebSocket implementation uses a bridge pattern where...
[Uses only 200 tokens to give precise answer]
```

## The Magic Behind the Scenes

1. **Indexing Creates a Map**
   - BigParse scans your codebase once
   - Extracts all symbols, functions, classes
   - Creates searchable index
   - Caches everything

2. **Claude Queries the Map**
   - Instead of reading files
   - Claude queries: "find X", "show symbols", "find references"
   - Gets instant, precise results

3. **You See the Benefits**
   - Claude knows your codebase structure
   - Can navigate between files
   - Understands relationships
   - Works with huge codebases

## How to Verify in Practice

1. **Ask Claude about your code structure**
   - "What are all the interfaces in my project?"
   - "Show me all async functions"
   - "Find all React components"

2. **Watch for tool usage**
   - Claude will show when it's searching
   - You'll see file paths and line numbers
   - Results come back instantly

3. **Compare with/without**
   - Try asking without BigParse: Claude asks for files
   - With BigParse: Claude already knows where to look

## The Bottom Line

BigParse turns Claude from a "code reader" into a "code navigator". Instead of you being Claude's eyes (pasting files), BigParse gives Claude its own vision into your codebase.