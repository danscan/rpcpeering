/**
 * Constructs a URL for connecting to an initiator relay, implementing
 * the `toString` method, and a static `fromString` function
 */
export class ConnectionUrl {
  /**
   * The versioned connection URL scheme
   */
  static readonly SCHEME = 'danscanrpc-v1';

  /**
   * The URL of the initiator relay
   */
  url: string;

  /**
   * The protocols requested by the initiator relay
   */
  protocols: string[];

  /**
   * Parses a new ConnectionUrl from a URL string
   */
  static fromString(str: string) {
    // Split the URL into scheme and contents
    const [scheme, urlContents] = str.split(':');

    // Check the scheme
    if (scheme !== ConnectionUrl.SCHEME) throw new ConnectionUrl.ERRORS.IncorrectSchemeError(scheme);
    // Check the URL contents
    if (!urlContents) throw new ConnectionUrl.ERRORS.InvalidFormatError();

    // Split the URL contents into the relay URL and protocols
    const [relayUrl, protocolsStr] = urlContents.split('@');
    if (!relayUrl) throw new ConnectionUrl.ERRORS.InvalidFormatError();

    // Split the protocols
    const protocols = protocolsStr.split(',');
    if (protocols.length === 0) throw new ConnectionUrl.ERRORS.MissingProtocolsError();

    // Return the ConnectionUrl
    return new ConnectionUrl(relayUrl, protocols);
  }

  /**
   * Construct a new ConnectionUrl
   */
  constructor(
    /** The URL of the initiator relay */
    url: string,
    /** The protocols requested by the initiator relay */
    protocols: string[],
  ) {
    this.url = url;
    this.protocols = protocols;
  }

  /**
   * Convert the ConnectionUrl to a URL string
   */
  toString() {
    return `${ConnectionUrl.SCHEME}:${this.protocols.join(',')}@${this.url}`;
  }

  // –
  // Errors
  // –
  static ERRORS = {
    /**
     * Error thrown when the connection URL scheme is incorrect
     */
    IncorrectSchemeError: class IncorrectSchemeError extends Error {
      name = 'IncorrectSchemeError';
      message = 'Incorrect connection URL scheme';
      expectedScheme = ConnectionUrl.SCHEME;
      actualScheme: string;

      constructor(actualScheme: string) {
        super();
        this.actualScheme = actualScheme;
      }
    },

    /**
     * Error thrown when the connection URL contents are missing
     */
    InvalidFormatError: class InvalidFormatError extends Error {
      name = 'InvalidFormatError';
      message = `Invalid connection URL format. Expected format: '${ConnectionUrl.SCHEME}:[protocols]@[url]'`;
    },

    /**
     * Error thrown when the connection URL contains no protocols
     */
    MissingProtocolsError: class MissingProtocolsError extends Error {
      name = 'MissingProtocolsError';
      message = 'Missing connection URL protocols';
    },
  }
}