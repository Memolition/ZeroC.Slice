Implement a quic server
Implement a quic client

Implement RPC helper methods
- Calls (Promises?)
    - With response
    - Without responses
- Streams (Observables)
    - Unidirectional
    - Bidirectional

TS Slice Compiler
Read .slice definitions
Build types
    - interfaces
    - types
Build Classes


The RPC stack:
Communication layer: Currently QUIC
Serialization layer: Slice v2
RPC Service Class: The <Name>Service class should export (types) all available remote procedures

The RPC Calls:
A local method calls a remote procedure throuh the <Name>Service class instance
    `const result = Service.remoteProcdure([args]);`
Each method:
1. Validates input data
2. Serializes arguments 
3. Encodes them in Slice
4. Sends the RPC request
5. Awaits for the RPC to respond (using promises?)
6. Decodes response
7. Deserializes response
8. Returns the result



