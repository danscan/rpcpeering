/**
 * Constructs a URI for connecting to a peer, implementing
 * the `toString` method, and a static `fromString` function
 */
export class PeeringURI {
  /**
   * The versioned peering URI scheme
   */
  static readonly SCHEME = 'danscanrpc-peering@v1';

  /**
   * The URL of the peering server for the proposed session
   */
  url: string;

  /**
   * Parses a new PeeringURI from a URL string
   */
  static fromString(str: string) {
    // Split the URL into scheme and contents
    const [scheme, peeringServerUrl] = str.split(':');

    // Check the scheme
    if (scheme !== PeeringURI.SCHEME) throw new PeeringURI.ERRORS.IncorrectSchemeError(scheme);
    // Check the URL contents
    if (!peeringServerUrl) throw new PeeringURI.ERRORS.InvalidFormatError();

    // Return the PeeringURI
    return new PeeringURI(peeringServerUrl);
  }

  /**
   * Construct a new PeeringURI
   */
  constructor(
    /** The URL of the initiator relay */
    url: string,
  ) {
    this.url = url;
  }

  /**
   * Convert the PeeringURI to a URL string
   */
  toString() {
    return `${PeeringURI.SCHEME}:${this.url}`;
  }

  // –
  // Errors
  // –
  static ERRORS = {
    /**
     * Error thrown when the peering URI scheme is incorrect
     */
    IncorrectSchemeError: class IncorrectSchemeError extends Error {
      name = 'IncorrectSchemeError';
      message = 'Incorrect peering URI scheme';
      expectedScheme = PeeringURI.SCHEME;
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
      message = `Invalid peering URL format. Expected format: '${PeeringURI.SCHEME}:[url]'`;
    },
  }
}