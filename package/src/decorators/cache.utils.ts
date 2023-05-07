import _ from 'lodash';
import stableStringify from 'json-stable-stringify';
import {
  DEFAULT_CACHE_SEPARATOR,
  DEFAULT_FUNCTION_ARGS_POSTFIX,
} from '../constants';
import { GeneratorFunction } from './types';

export const defaultFunctionArgsSerializer: GeneratorFunction = <T>(
  functionArgs: T,
): string => {
  return Buffer.from(stableStringify(functionArgs) ?? '{}').toString('base64');
};

export const generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs =
  ({
    functionArgsSerializer,
    functionArgs,
    cacheSeparator,
    className,
    functionName,
  }: {
    functionArgsSerializer?: GeneratorFunction;
    functionArgs: unknown;
    cacheSeparator?: string;
    className: string;
    functionName: string;
  }): string | never => {
    const actualFunctionArgsSerializer: GeneratorFunction =
      functionArgsSerializer ?? defaultFunctionArgsSerializer;

    let postFix: string;

    try {
      postFix = !_.isEmpty(functionArgs)
        ? actualFunctionArgsSerializer(functionArgs)
        : DEFAULT_FUNCTION_ARGS_POSTFIX;
    } catch (error) {
      const originalErrorMessage: string | undefined = _.get(error, 'message');

      const errorMessage: string = originalErrorMessage
        ? `Error generate postfix from function args: ${originalErrorMessage}`
        : 'Error generate postfix from function args';

      const errorStack: string | undefined = _.get(error, 'stack');

      const err = new Error(errorMessage);
      err.stack = errorStack;

      throw err;
    }

    const separator: string = cacheSeparator ?? DEFAULT_CACHE_SEPARATOR;

    return `${className}${separator}${functionName}${separator}${postFix}`;
  };

export const translateKeyOrGeneratorToString = ({
  keyOrGenerator,
  functionArgsSerializer,
  functionArgs,
  cacheSeparator,
  className,
  functionName,
}: {
  keyOrGenerator?: string | GeneratorFunction;
  functionArgsSerializer?: GeneratorFunction;
  functionArgs: unknown;
  cacheSeparator?: string;
  className: string;
  functionName: string;
}): string => {
  let key: string;

  if (!keyOrGenerator) {
    key =
      generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs(
        {
          cacheSeparator,
          className,
          functionName,
          functionArgs,
          functionArgsSerializer,
        },
      );
  } else if (typeof keyOrGenerator === 'function') {
    const generator: GeneratorFunction = keyOrGenerator;
    key = generator(functionArgs);
  } else {
    key = keyOrGenerator;
  }

  return key;
};
