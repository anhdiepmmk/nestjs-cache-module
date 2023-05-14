import * as cacheUtility from './cache.utility';
import stableStringify from 'json-stable-stringify';

describe('cache.utility', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('translateKeyOrGeneratorToString', () => {
    it('should return a cache key', () => {
      expect(
        cacheUtility.translateKeyOrGeneratorToString({
          className: 'ClassName',
          functionArgs: ['hello world'],
          functionName: 'sayHello',
          keyOrGenerator: 'a-cache-key',
          functionArgsSerializer: undefined,
          cacheSeparator: undefined,
        }),
      ).toBe('a-cache-key');
    });

    it('when `keyOrGenerator` is a generator should using the generator to generate cache key and return it', () => {
      const customKeyGenerator = jest.fn((functionArgs: any) => {
        return (functionArgs as string[]).join('&');
      });

      expect(
        cacheUtility.translateKeyOrGeneratorToString({
          className: 'ClassName',
          functionArgs: ['hello world', 'hi there'],
          functionName: 'sayHello',
          keyOrGenerator: customKeyGenerator,
        }),
      ).toBe('hello world&hi there');

      expect(customKeyGenerator).toHaveBeenCalled();
    });

    it('when `keyOrGenerator` is not provided should return a generate cache key based on class name, function name and default function args serializer', () => {
      jest.spyOn(
        cacheUtility,
        'generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs',
      );

      expect(
        cacheUtility.translateKeyOrGeneratorToString({
          className: 'ClassName',
          functionArgs: ['hello world'],
          functionName: 'sayHello',
          keyOrGenerator: undefined,
          functionArgsSerializer: undefined,
        }),
      ).toBe('ClassName:sayHello:WyJoZWxsbyB3b3JsZCJd');

      expect(
        cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs,
      ).toHaveBeenCalled();

      expect(
        cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs,
      ).toBeCalledWith({
        cacheSeparator: undefined,
        className: 'ClassName',
        functionArgs: ['hello world'],
        functionArgsSerializer: undefined,
        functionName: 'sayHello',
      });
    });

    it('when `keyOrGenerator` is not provided should return a generate cache key based on class name, function name and custom function args serializer', () => {
      jest.spyOn(
        cacheUtility,
        'generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs',
      );

      const customFunctionArgsSerializer = jest.fn((functionArgs) => {
        return (functionArgs as string[]).join('&');
      });

      expect(
        cacheUtility.translateKeyOrGeneratorToString({
          className: 'ClassName',
          functionArgs: ['hello world', 'hi there'],
          functionName: 'sayHello',
          keyOrGenerator: undefined,
          functionArgsSerializer: customFunctionArgsSerializer,
        }),
      ).toBe('ClassName:sayHello:hello world&hi there');

      expect(
        cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs,
      ).toHaveBeenCalled();

      expect(
        cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs,
      ).toBeCalledWith({
        cacheSeparator: undefined,
        className: 'ClassName',
        functionArgs: ['hello world', 'hi there'],
        functionArgsSerializer: customFunctionArgsSerializer,
        functionName: 'sayHello',
      });
    });

    it('when `keyOrGenerator` and `functionArgs` is not provided should return a generate cache key based on class name, function name and using `EmptyArgs` as postfix', () => {
      jest.spyOn(
        cacheUtility,
        'generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs',
      );

      expect(
        cacheUtility.translateKeyOrGeneratorToString({
          className: 'ClassName',
          functionArgs: undefined,
          functionName: 'sayHello',
          keyOrGenerator: undefined,
        }),
      ).toBe('ClassName:sayHello:EmptyArgs');

      expect(
        cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs,
      ).toHaveBeenCalled();

      expect(
        cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs,
      ).toBeCalledWith({
        cacheSeparator: undefined,
        className: 'ClassName',
        functionArgs: undefined,
        functionArgsSerializer: undefined,
        functionName: 'sayHello',
      });
    });
  });

  describe('defaultFunctionArgsSerializer', () => {
    it('should return base64 string', () => {
      const functionArgs = {
        a: 'a value',
      };

      const str: string =
        cacheUtility.defaultFunctionArgsSerializer(functionArgs);

      expect(str).toBe(
        Buffer.from(stableStringify(functionArgs)).toString('base64'),
      );
    });

    it('when function args unsorted should sort and return base64 string correctly as normal', () => {
      const functionArgs = {
        b: 'b value',
        a: 'a value',
      };

      const str: string =
        cacheUtility.defaultFunctionArgsSerializer(functionArgs);

      expect(str).toBe(
        Buffer.from(
          stableStringify({
            a: 'a value',
            b: 'b value',
          }),
        ).toString('base64'),
      );
    });

    it('when function args is invalid should return base64 as usual', () => {
      const functionArgs = undefined;

      const str: string =
        cacheUtility.defaultFunctionArgsSerializer(functionArgs);

      expect(str).toBe(Buffer.from('{}').toString('base64'));
    });
  });

  describe('generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs', () => {
    it('should return a generated cache key', () => {
      const key: string =
        cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs(
          {
            className: 'ClassA',
            functionName: 'sayHello',
            functionArgs: ['hello'],
            cacheSeparator: undefined,
            functionArgsSerializer: undefined,
          },
        );

      const base64PostFix: string = cacheUtility.defaultFunctionArgsSerializer([
        'hello',
      ]);

      expect(key).toBe(`ClassA:sayHello:${base64PostFix}`);
    });

    describe('generate postfix based on function args', () => {
      it('when function args serializer is provided should using it to generate postfix', () => {
        const fn = jest.fn((functionArgs) => {
          return (functionArgs as string[]).join('&');
        });

        jest.spyOn(cacheUtility, 'defaultFunctionArgsSerializer');

        const key: string =
          cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs(
            {
              className: 'ClassA',
              functionName: 'sayHello',
              functionArgs: ['hi bob', 'hi there'],
              functionArgsSerializer: fn,
              cacheSeparator: undefined,
            },
          );

        expect(key).toBe(`ClassA:sayHello:hi bob&hi there`);
        expect(
          cacheUtility.defaultFunctionArgsSerializer,
        ).not.toHaveBeenCalled();
      });

      it('when function args serializer is not provided should using default function args serializer to generate postfix', () => {
        jest.spyOn(cacheUtility, 'defaultFunctionArgsSerializer');

        const key: string =
          cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs(
            {
              className: 'ClassA',
              functionName: 'sayHello',
              functionArgs: ['hi bob'],
              cacheSeparator: undefined,
            },
          );

        const base64PostFix: string =
          cacheUtility.defaultFunctionArgsSerializer(['hi bob']);

        expect(key).toBe(`ClassA:sayHello:${base64PostFix}`);
        expect(cacheUtility.defaultFunctionArgsSerializer).toHaveBeenCalled();
        expect(
          cacheUtility.defaultFunctionArgsSerializer,
        ).toHaveBeenCalledTimes(2);
        expect(
          cacheUtility.defaultFunctionArgsSerializer,
        ).toHaveBeenNthCalledWith(1, ['hi bob']);

        expect(
          cacheUtility.defaultFunctionArgsSerializer,
        ).toHaveBeenNthCalledWith(2, ['hi bob']);
      });

      it('when function args is empty or not provided should using `EmptyArgs` as default postfix', () => {
        const key1: string =
          cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs(
            {
              className: 'ClassA',
              functionName: 'sayHello',
              functionArgs: [],
              cacheSeparator: undefined,
            },
          );

        const key2: string =
          cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs(
            {
              className: 'ClassA',
              functionName: 'sayHello',
              functionArgs: [],
              cacheSeparator: undefined,
            },
          );

        expect(key1).toBe('ClassA:sayHello:EmptyArgs');
        expect(key2).toBe('ClassA:sayHello:EmptyArgs');
      });

      it('should throw an error with formatted message when function args serializer throw an error', () => {
        const fn1: Function = () =>
          cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs(
            {
              className: 'ClassA',
              functionName: 'sayHello',
              functionArgs: ['hello'],
              cacheSeparator: undefined,
              functionArgsSerializer: () => {
                throw new Error('test');
              },
            },
          );

        const fn2: Function = () =>
          cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs(
            {
              className: 'ClassA',
              functionName: 'sayHello',
              functionArgs: ['hello'],
              cacheSeparator: undefined,
              functionArgsSerializer: () => {
                throw new Error(undefined);
              },
            },
          );

        expect(fn1).toThrowError(
          new Error('Error generate postfix from function args: test'),
        );

        expect(fn2).toThrowError(
          new Error('Error generate postfix from function args'),
        );
      });
    });

    describe('cache separator', () => {
      it('when `cache separator` is not set then should return a generated cache key with `:` as default separator', () => {
        const key: string =
          cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs(
            {
              className: 'ClassA',
              functionName: 'sayHello',
              functionArgs: ['hello'],
              cacheSeparator: undefined,
              functionArgsSerializer: undefined,
            },
          );

        const base64PostFix: string =
          cacheUtility.defaultFunctionArgsSerializer(['hello']);

        expect(key).toBe(`ClassA:sayHello:${base64PostFix}`);
      });

      it('when `cache separator` is set should return a generated cache key with override operator', () => {
        const key: string =
          cacheUtility.generateProgrammaticallyKeyBasedOnClassNameAndFunctionNameAndFunctionArgs(
            {
              className: 'ClassA',
              functionName: 'sayHello',
              functionArgs: ['hello'],
              cacheSeparator: '_',
              functionArgsSerializer: undefined,
            },
          );

        const base64PostFix: string =
          cacheUtility.defaultFunctionArgsSerializer(['hello']);

        expect(key).toBe(`ClassA_sayHello_${base64PostFix}`);
      });
    });
  });
});
