import { describe, expect, it } from 'bun:test';
import { PeeringURI } from './PeeringURI';

describe('PeeringURI', () => {
  it('should construct a peering URI', () => {
    const peeringUri = new PeeringURI('https://rpcpeering.org/rpcpeering', 'test');
    expect(peeringUri.toString()).toBe(`rpcpeering+test:${encodeURIComponent('https://rpcpeering.org/rpcpeering')}`);
    expect(peeringUri.url).toBe('https://rpcpeering.org/rpcpeering');
    expect(peeringUri.topic).toBe('test');
  });

  it('should parse a peering URI', () => {
    const peeringUri = PeeringURI.fromString(`rpcpeering+test:${encodeURIComponent('https://rpcpeering.org/rpcpeering')}`);
    expect(peeringUri.url).toBe('https://rpcpeering.org/rpcpeering');
    expect(peeringUri.topic).toBe('test');
  });
});
