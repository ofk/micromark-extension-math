import assert from 'assert'
import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding} from 'micromark-util-character'
import {codes} from 'micromark-util-symbol/codes.js'
import {constants} from 'micromark-util-symbol/constants.js'
import {types} from 'micromark-util-symbol/types.js'

export const mathFlow = {
  tokenize: tokenizeMathFenced,
  concrete: true
}

function tokenizeMathFenced(effects, ok, nok) {
  const self = this
  const tail = self.events[self.events.length - 1]
  const initialSize =
    tail && tail[1].type === types.linePrefix
      ? tail[2].sliceSerialize(tail[1], true).length
      : 0
  let sizeOpen = 0

  return start

  function start(code) {
    assert(code === codes.dollarSign, 'expected `$`')
    effects.enter('mathFlow')
    effects.enter('mathFlowFence')
    effects.enter('mathFlowFenceSequence')
    return sequenceOpen(code)
  }

  function sequenceOpen(code) {
    if (code === codes.dollarSign) {
      effects.consume(code)
      sizeOpen++
      return sequenceOpen
    }

    effects.exit('mathFlowFenceSequence')
    return sizeOpen < 2
      ? nok(code)
      : factorySpace(effects, metaOpen, types.whitespace)(code)
  }

  function metaOpen(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return openAfter(code)
    }

    effects.enter('mathFlowFenceMeta')
    effects.enter(types.chunkString, {contentType: constants.contentTypeString})
    return meta(code)
  }

  function meta(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.chunkString)
      effects.exit('mathFlowFenceMeta')
      return openAfter(code)
    }

    if (code === codes.dollarSign) return nok(code)
    effects.consume(code)
    return meta
  }

  function openAfter(code) {
    effects.exit('mathFlowFence')
    return self.interrupt ? ok(code) : content(code)
  }

  function content(code) {
    if (code === codes.eof) {
      return after(code)
    }

    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return effects.attempt(
        {tokenize: tokenizeClosingFence, partial: true},
        after,
        initialSize
          ? factorySpace(effects, content, types.linePrefix, initialSize + 1)
          : content
      )
    }

    effects.enter('mathFlowValue')
    return contentContinue(code)
  }

  function contentContinue(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit('mathFlowValue')
      return content(code)
    }

    effects.consume(code)
    return contentContinue
  }

  function after(code) {
    effects.exit('mathFlow')
    return ok(code)
  }

  function tokenizeClosingFence(effects, ok, nok) {
    let size = 0

    return factorySpace(
      effects,
      closingPrefixAfter,
      types.linePrefix,
      constants.tabSize
    )

    function closingPrefixAfter(code) {
      effects.enter('mathFlowFence')
      effects.enter('mathFlowFenceSequence')
      return closingSequence(code)
    }

    function closingSequence(code) {
      if (code === codes.dollarSign) {
        effects.consume(code)
        size++
        return closingSequence
      }

      if (size < sizeOpen) return nok(code)
      effects.exit('mathFlowFenceSequence')
      return factorySpace(effects, closingSequenceEnd, types.whitespace)(code)
    }

    function closingSequenceEnd(code) {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects.exit('mathFlowFence')
        return ok(code)
      }

      return nok(code)
    }
  }
}