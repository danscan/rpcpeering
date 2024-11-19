/**
 * Constructs a URI for connecting to a peer, implementing
 * the `toString` method, and a static `fromString` function
 */
export class PeeringURI {
  /**
   * The versioned peering URI scheme
   */
  static readonly SCHEME = 'rpcpeering';

  /**
   * The primary topic requested of the responder, used to filter the responder apps shown to the user.
   */
  topic: string;

  /**
   * The URL of the peering server for the proposed session
   */
  url: string;

  /**
   * Parses a new PeeringURI from a URL string
   */
  static fromString(str: string) {
    // Split the URL into scheme and contents
    const [schemePart, peeringServerUrl] = str.split(':');

    // Split the scheme part into the scheme and topic
    const [scheme, ...topicParts] = schemePart.split('+');
    const topic = topicParts.join('+'); // Anything after the first `+` is the topic, which may include `+` characters

    // Check the scheme
    if (scheme !== PeeringURI.SCHEME) throw new PeeringURI.ERRORS.IncorrectSchemeError(scheme);
    // Check the URL contents
    if (!peeringServerUrl) throw new PeeringURI.ERRORS.InvalidFormatError();

    // Return the PeeringURI
    return new PeeringURI(decodeURIComponent(peeringServerUrl), topic);
  }

  /**
   * Construct a new PeeringURI
   */
  constructor(
    /** The URL of the initiator relay */
    url: string,
    /** The primary topic requested of the responder */
    topic: string,
  ) {
    this.url = url;
    this.topic = topic;
  }

  /**
   * Convert the PeeringURI to a URL string
   */
  toString() {
    return `${PeeringURI.SCHEME}+${this.topic}:${encodeURIComponent(this.url)}`;
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
      message = `Invalid peering URL format. Expected format: '${PeeringURI.SCHEME}+[topic]:[url]'`;
    },
  }
}